import type { SupabaseClient } from "@supabase/supabase-js";
import { getBusinessProfile } from "@/lib/business";
import { updateGoogleCalendarPaymentStatus } from "@/lib/google-calendar";
import { fetchPaymentBundle } from "@/lib/payment-server";
import { formatSlotsLabel } from "@/lib/slots";
import type { SlotType } from "@/lib/slots";

/** Sincroniza Google Calendar quando o pagamento do lead muda */
export async function syncLeadGoogleCalendarPayment(
  supabase: SupabaseClient,
  leadId: string
): Promise<void> {
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "name, whatsapp, location, neighborhood, guest_count, event_type, observations, internal_notes, google_event_id, slot_type, slot_types"
    )
    .eq("id", leadId)
    .single();

  if (!lead?.google_event_id) return;

  const bundle = await fetchPaymentBundle(supabase, leadId);
  if (!bundle) return;

  const { summary } = bundle;
  const isPaid = summary.remaining <= 0.009 && summary.received > 0;

  const profile = await getBusinessProfile(supabase);
  if (!profile?.google_calendar_token) return;

  const turnos = formatSlotsLabel(
    lead.slot_types as SlotType[] | null,
    lead.slot_type as SlotType | null
  );

  const descriptionBase = [
    `Cliente: ${lead.name}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Local: ${lead.location} - ${lead.neighborhood}`,
    `Convidados: ~${lead.guest_count}`,
    `Tipo: ${lead.event_type}`,
    turnos ? `Turnos: ${turnos}` : "",
    lead.observations ? `Obs: ${lead.observations}` : "",
    lead.internal_notes ? `Notas: ${lead.internal_notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await updateGoogleCalendarPaymentStatus(
    profile.google_calendar_token as Record<string, unknown>,
    {
      eventId: lead.google_event_id,
      calendarId: (profile.google_calendar_id as string) ?? undefined,
      eventType: lead.event_type ?? "Evento",
      leadName: lead.name,
      descriptionBase,
      total: summary.total,
      received: summary.received,
      isPaid,
    }
  );
}
