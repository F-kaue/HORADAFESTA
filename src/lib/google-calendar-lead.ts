import type { SupabaseClient } from "@supabase/supabase-js";
import { addHoursToTime } from "@/lib/event-time";
import { formatTimeRange } from "@/lib/event-time";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { getBusinessProfile } from "@/lib/business";
import type { Lead } from "@/types/database";

type CalendarProfile = {
  google_calendar_token: Record<string, unknown>;
  google_calendar_id?: string | null;
};

export async function getCalendarProfile(
  supabase: SupabaseClient,
  userId?: string
): Promise<CalendarProfile | null> {
  if (userId) {
    const { data } = await supabase
      .from("profiles")
      .select("google_calendar_token, google_calendar_id")
      .eq("id", userId)
      .maybeSingle();
    if (data?.google_calendar_token) {
      return data as CalendarProfile;
    }
  }

  const business = await getBusinessProfile(supabase);
  if (business?.google_calendar_token) {
    return business as CalendarProfile;
  }

  const { data: connected } = await supabase
    .from("profiles")
    .select("google_calendar_token, google_calendar_id")
    .not("google_calendar_token", "is", null)
    .limit(1)
    .maybeSingle();

  if (connected?.google_calendar_token) {
    return connected as CalendarProfile;
  }

  return null;
}

export function resolveLeadSchedule(lead: Lead): {
  date: string;
  startTime: string;
  endTime: string;
} | null {
  if (!lead.event_date) return null;

  const startTime = lead.event_start_time?.slice(0, 5) ?? "13:00";
  const endTime =
    lead.event_end_time?.slice(0, 5) ?? addHoursToTime(startTime, 3);

  return {
    date: lead.event_date,
    startTime,
    endTime,
  };
}

export async function createCalendarEventForLead(
  supabase: SupabaseClient,
  userId: string,
  lead: Lead,
  extra?: {
    serviceType?: string | null;
    internalNotes?: string | null;
    downPayment?: number;
  }
): Promise<{ eventId: string | null; error?: string }> {
  const profile = await getCalendarProfile(supabase, userId);
  if (!profile) {
    return {
      eventId: null,
      error: "Google Calendar não conectado nesta conta.",
    };
  }

  const schedule = resolveLeadSchedule(lead);
  if (!schedule) {
    return {
      eventId: null,
      error: "Lead sem data de evento para criar no calendário.",
    };
  }

  const scheduleLabel = formatTimeRange(schedule.startTime, schedule.endTime);
  const serviceLabel = extra?.serviceType ?? lead.service_type ?? lead.event_type;

  const description = [
    `Cliente: ${lead.name}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Local: ${lead.location} - ${lead.neighborhood}`,
    `Convidados: ~${lead.guest_count}`,
    `Tipo: ${lead.event_type}`,
    serviceLabel ? `Serviço: ${serviceLabel}` : "",
    `Horário: ${scheduleLabel}`,
    lead.observations ? `Obs: ${lead.observations}` : "",
    extra?.internalNotes ? `Notas: ${extra.internalNotes}` : "",
    lead.internal_notes ? `Notas: ${lead.internal_notes}` : "",
    extra?.downPayment && extra.downPayment > 0
      ? `Entrada: R$ ${extra.downPayment.toFixed(2)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await createGoogleCalendarEvent(
    profile.google_calendar_token,
    {
      title: `🎉 ${lead.event_type} — ${lead.name}`,
      description,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      calendarId: profile.google_calendar_id ?? undefined,
    }
  );

  if (!result.eventId) {
    return {
      eventId: null,
      error: result.error ?? "Falha ao criar evento no Google Calendar.",
    };
  }

  return { eventId: result.eventId };
}
