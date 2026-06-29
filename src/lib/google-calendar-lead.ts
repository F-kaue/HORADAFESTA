import type { SupabaseClient } from "@supabase/supabase-js";
import { addHoursToTime } from "@/lib/event-time";
import { formatTimeRange } from "@/lib/event-time";
import {
  buildCalendarEventTitle,
  buildCalendarPaymentLine,
  createGoogleCalendarEvent,
  updateGoogleCalendarEventDetails,
} from "@/lib/google-calendar";
import { fetchPaymentBundle } from "@/lib/payment-server";
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

export function buildLeadCalendarDescription(
  lead: Pick<
    Lead,
    | "name"
    | "whatsapp"
    | "location"
    | "neighborhood"
    | "guest_count"
    | "event_type"
    | "service_type"
    | "observations"
    | "internal_notes"
    | "event_start_time"
    | "event_end_time"
  >
): string {
  const scheduleLabel = formatTimeRange(
    lead.event_start_time,
    lead.event_end_time
  );

  return [
    `Cliente: ${lead.name}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Local: ${lead.location} - ${lead.neighborhood}`,
    `Convidados: ~${lead.guest_count}`,
    `Tipo: ${lead.event_type}`,
    lead.service_type ? `Serviço: ${lead.service_type}` : "",
    scheduleLabel ? `Horário: ${scheduleLabel}` : "",
    lead.observations ? `Obs: ${lead.observations}` : "",
    lead.internal_notes ? `Notas: ${lead.internal_notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function syncLeadGoogleCalendarDetails(
  supabase: SupabaseClient,
  leadId: string,
  userId?: string
): Promise<{ synced: boolean; created: boolean; error?: string }> {
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return { synced: false, created: false, error: "Lead não encontrado." };
  }

  const shouldSync =
    !!lead.google_event_id ||
    lead.status === "confirmado" ||
    lead.status === "finalizado";

  if (!shouldSync) {
    return { synced: false, created: false };
  }

  const profile = await getCalendarProfile(supabase, userId);
  if (!profile) {
    return {
      synced: false,
      created: false,
      error: "Google Calendar não conectado nesta conta.",
    };
  }

  const schedule = resolveLeadSchedule(lead as Lead);
  if (!schedule) {
    return {
      synced: false,
      created: false,
      error: "Informe a data do evento para sincronizar com o calendário.",
    };
  }

  const bundle = await fetchPaymentBundle(supabase, leadId);
  const isPaid =
    bundle != null &&
    bundle.summary.remaining <= 0.009 &&
    bundle.summary.received > 0;
  const isFinalized = lead.status === "finalizado";

  let description = buildLeadCalendarDescription(lead as Lead);
  if (bundle && bundle.summary.total > 0) {
    description = [
      description.replace(/\n💰 Pagamento:.*$/gm, "").trim(),
      buildCalendarPaymentLine(
        bundle.summary.received,
        bundle.summary.total,
        isPaid
      ),
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (isFinalized) {
    description = `${description}\nStatus: Evento realizado`.trim();
  }

  const title = buildCalendarEventTitle(
    lead.event_type ?? "Evento",
    lead.name,
    isFinalized
  );

  let colorId = "10";
  if (isFinalized) colorId = "8";
  else if (isPaid) colorId = "2";

  if (!lead.google_event_id) {
    const created = await createGoogleCalendarEvent(profile.google_calendar_token, {
      title,
      description,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      calendarId: profile.google_calendar_id ?? undefined,
    });

    if (!created.eventId) {
      return {
        synced: false,
        created: false,
        error: created.error ?? "Falha ao criar evento no Google Calendar.",
      };
    }

    await supabase
      .from("leads")
      .update({ google_event_id: created.eventId })
      .eq("id", leadId);

    return { synced: true, created: true };
  }

  const updated = await updateGoogleCalendarEventDetails(
    profile.google_calendar_token,
    {
      eventId: lead.google_event_id,
      calendarId: profile.google_calendar_id ?? undefined,
      title,
      description,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      colorId,
    }
  );

  if (!updated.ok) {
    return {
      synced: false,
      created: false,
      error: updated.error ?? "Falha ao atualizar Google Calendar.",
    };
  }

  return { synced: true, created: false };
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

  const serviceLabel = extra?.serviceType ?? lead.service_type ?? lead.event_type;

  const description = [
    buildLeadCalendarDescription({
      ...lead,
      service_type: serviceLabel,
      internal_notes: extra?.internalNotes ?? lead.internal_notes,
    }),
    extra?.downPayment && extra.downPayment > 0
      ? `Entrada: R$ ${extra.downPayment.toFixed(2)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await createGoogleCalendarEvent(
    profile.google_calendar_token,
    {
      title: buildCalendarEventTitle(
        lead.event_type ?? "Evento",
        lead.name
      ),
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
