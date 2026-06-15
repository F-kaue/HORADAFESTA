import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessProfile } from "@/lib/business";

function dayCapacityStatus(
  eventCount: number,
  maxEvents: number
): "available" | "partial" | "full" {
  if (eventCount >= maxEvents) return "full";
  if (eventCount > 0) return "partial";
  return "available";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const date = searchParams.get("date");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const db = user ? supabase : admin;
  const profile = await getBusinessProfile(admin);
  const maxEvents = Number(profile?.max_events_per_day ?? 2);

  if (date) {
    const excludeLeadId = searchParams.get("exclude_lead_id");
    let q = db
      .from("leads")
      .select("event_start_time, event_end_time, service_type")
      .eq("event_date", date)
      .eq("status", "confirmado");
    if (excludeLeadId) q = q.neq("id", excludeLeadId);

    const { data: leads } = await q;
    const eventCount = leads?.length ?? 0;

    return NextResponse.json({
      date,
      available: eventCount < maxEvents,
      eventCount,
      maxEvents,
      occupiedTimes: (leads ?? [])
        .filter((l) => l.event_start_time && l.event_end_time)
        .map((l) => ({
          start: String(l.event_start_time).slice(0, 5),
          end: String(l.event_end_time).slice(0, 5),
          service: l.service_type,
        })),
    });
  }

  if (!month) {
    return NextResponse.json({ error: "month ou date obrigatório" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const endDay = new Date(year, monthNum, 0).getDate();
  const endDate = `${year}-${String(monthNum).padStart(2, "0")}-${endDay}`;

  const { data: confirmedLeads } = await db
    .from("leads")
    .select("event_date")
    .eq("status", "confirmado")
    .gte("event_date", startDate)
    .lte("event_date", endDate);

  const countByDate: Record<string, number> = {};
  (confirmedLeads ?? []).forEach((l) => {
    const d = l.event_date as string;
    countByDate[d] = (countByDate[d] ?? 0) + 1;
  });

  const workingDays = (profile?.working_days as number[]) ?? [0, 1, 2, 3, 4, 5, 6];
  const blocked = ((profile?.blocked_dates as string[]) ?? []) as string[];

  const days: Record<string, "available" | "partial" | "full"> = {};
  for (let d = 1; d <= endDay; d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();

    if (!workingDays.includes(dayOfWeek) || blocked.includes(dateStr)) {
      days[dateStr] = "full";
    } else {
      days[dateStr] = dayCapacityStatus(countByDate[dateStr] ?? 0, maxEvents);
    }
  }

  return NextResponse.json({ month, days, maxEvents });
}
