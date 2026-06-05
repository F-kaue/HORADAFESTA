import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessProfile } from "@/lib/business";
import { dayStatus, type SlotType } from "@/lib/slots";
import { getGoogleCalendarBusyDates } from "@/lib/google-calendar";

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

  if (date) {
    const excludeLeadId = searchParams.get("exclude_lead_id");
    const { data: slots } = await db.rpc("get_available_slots_shared", {
      check_date: date,
      exclude_lead_id: excludeLeadId || null,
    });

    return NextResponse.json({ date, slots: slots ?? [] });
  }

  if (!month) {
    return NextResponse.json({ error: "month ou date obrigatório" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const endDay = new Date(year, monthNum, 0).getDate();
  const endDate = `${year}-${String(monthNum).padStart(2, "0")}-${endDay}`;

  const { data: eventSlots } = await db
    .from("event_slots")
    .select("event_date, slot_type")
    .eq("status", "confirmado")
    .gte("event_date", startDate)
    .lte("event_date", endDate);

  const profile = await getBusinessProfile(admin);

  let googleBusy: Record<string, SlotType[]> = {};
  if (profile?.google_calendar_token) {
    try {
      googleBusy = await getGoogleCalendarBusyDates(
        profile.google_calendar_token as Record<string, unknown>,
        startDate,
        endDate
      );
    } catch {
      // Google sync optional
    }
  }

  const byDate: Record<string, SlotType[]> = {};
  (eventSlots ?? []).forEach((s) => {
    const d = s.event_date as string;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(s.slot_type as SlotType);
  });

  Object.entries(googleBusy).forEach(([d, slots]) => {
    if (!byDate[d]) byDate[d] = [];
    slots.forEach((sl) => {
      if (!byDate[d].includes(sl)) byDate[d].push(sl);
    });
  });

  const days: Record<string, "available" | "partial" | "full"> = {};
  for (let d = 1; d <= endDay; d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
    const workingDays = (profile?.working_days as number[]) ?? [0, 1, 2, 3, 4, 5, 6];
    const blocked = ((profile?.blocked_dates as string[]) ?? []).includes(dateStr);

    if (!workingDays.includes(dayOfWeek) || blocked) {
      days[dateStr] = "full";
    } else {
      days[dateStr] = dayStatus(byDate[dateStr] ?? []);
    }
  }

  return NextResponse.json({ month, days });
}
