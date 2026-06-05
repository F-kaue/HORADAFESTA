import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessProfile } from "@/lib/business";
import { listGoogleCalendarEvents } from "@/lib/google-calendar";
import { fetchAllPaymentSummaries } from "@/lib/payment-server";
import { mergeAgendaEvents } from "@/lib/events";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros from e to obrigatórios" }, { status: 400 });
  }

  const profile = await getBusinessProfile(supabase);
  const googleConnected = Boolean(profile?.google_calendar_token);

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .in("status", ["confirmado", "finalizado"])
    .is("archived_at", null)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payments = await fetchAllPaymentSummaries(supabase);

  let googleEvents: Awaited<ReturnType<typeof listGoogleCalendarEvents>> = [];
  if (googleConnected && profile?.google_calendar_token) {
    const timeMin = new Date(`${from}T00:00:00-03:00`).toISOString();
    const timeMax = new Date(`${to}T23:59:59-03:00`).toISOString();
    try {
      googleEvents = await listGoogleCalendarEvents(
        profile.google_calendar_token as Record<string, unknown>,
        {
          timeMin,
          timeMax,
          calendarId: (profile.google_calendar_id as string) ?? undefined,
        }
      );
    } catch {
      googleEvents = [];
    }
  }

  const events = mergeAgendaEvents(leads ?? [], googleEvents, payments);

  return NextResponse.json({
    events,
    googleConnected,
    range: { from, to },
  });
}
