import type { SupabaseClient } from "@supabase/supabase-js";
import { getCalendarProfile } from "@/lib/google-calendar-lead";
import {
  extractClientNameFromSummary,
  listGoogleCalendarEvents,
  updateGoogleCalendarFinalizedStatus,
} from "@/lib/google-calendar";
import { fetchPaymentBundle } from "@/lib/payment-server";
import { formatSlotsLabel } from "@/lib/slots";
import type { SlotType } from "@/lib/slots";

async function resolveGoogleEventId(
  supabase: SupabaseClient,
  lead: {
    id: string;
    name: string;
    event_date: string | null;
    google_event_id: string | null;
  },
  profile: Record<string, unknown>
): Promise<string | null> {
  if (lead.google_event_id) return lead.google_event_id;
  if (!lead.event_date || !profile.google_calendar_token) return null;

  const timeMin = new Date(`${lead.event_date}T00:00:00-03:00`).toISOString();
  const timeMax = new Date(`${lead.event_date}T23:59:59-03:00`).toISOString();

  const events = await listGoogleCalendarEvents(
    profile.google_calendar_token as Record<string, unknown>,
    {
      timeMin,
      timeMax,
      calendarId: (profile.google_calendar_id as string) ?? undefined,
    }
  );

  for (const g of events) {
    const clientName = extractClientNameFromSummary(g.summary);
    if (
      clientName?.toLowerCase() === lead.name.toLowerCase() &&
      g.start.slice(0, 10) === lead.event_date
    ) {
      await supabase
        .from("leads")
        .update({ google_event_id: g.id })
        .eq("id", lead.id);
      return g.id;
    }
  }

  return null;
}

/** Atualiza o evento existente no Google Calendar quando o lead é finalizado */
export async function syncLeadGoogleCalendarFinalized(
  supabase: SupabaseClient,
  leadId: string,
  userId?: string
): Promise<void> {
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, name, whatsapp, location, neighborhood, guest_count, event_type, observations, internal_notes, google_event_id, event_date, slot_type, slot_types"
    )
    .eq("id", leadId)
    .single();

  if (!lead) return;

  const profile = await getCalendarProfile(supabase, userId);
  if (!profile?.google_calendar_token) return;

  const eventId = await resolveGoogleEventId(supabase, lead, profile as Record<string, unknown>);
  if (!eventId) return;

  const bundle = await fetchPaymentBundle(supabase, leadId);
  const isPaid =
    bundle != null &&
    bundle.summary.remaining <= 0.009 &&
    bundle.summary.received > 0;

  const turnos = formatSlotsLabel(
    lead.slot_types as SlotType[] | null,
    lead.slot_type as SlotType | null
  );

  const description = [
    `Cliente: ${lead.name}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Local: ${lead.location} - ${lead.neighborhood}`,
    `Convidados: ~${lead.guest_count}`,
    `Tipo: ${lead.event_type}`,
    turnos ? `Turnos: ${turnos}` : "",
    lead.observations ? `Obs: ${lead.observations}` : "",
    lead.internal_notes ? `Notas: ${lead.internal_notes}` : "",
    "Status: Evento realizado",
  ]
    .filter(Boolean)
    .join("\n");

  await updateGoogleCalendarFinalizedStatus(
    profile.google_calendar_token as Record<string, unknown>,
    {
      eventId,
      calendarId: (profile.google_calendar_id as string) ?? undefined,
      eventType: lead.event_type ?? "Evento",
      leadName: lead.name,
      description,
      isPaid,
    }
  );
}
