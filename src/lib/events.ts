import type { Lead, LeadStatus } from "@/types/database";
import type { GoogleCalendarEventRow } from "@/lib/google-calendar";
import { extractClientNameFromSummary } from "@/lib/google-calendar";
import type { LeadPaymentSummary } from "@/lib/payment-status";
import { formatSlotsLabel } from "@/lib/slots";

export type AgendaEvent = {
  id: string;
  leadId: string | null;
  googleEventId: string | null;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  htmlLink: string | null;
  isPaid: boolean;
  paymentSummary: LeadPaymentSummary | null;
  status: LeadStatus | null;
  clientName: string;
  whatsapp: string | null;
  eventType: string | null;
  location: string | null;
  neighborhood: string | null;
  guestCount: number | null;
  slotsLabel: string | null;
  source: "crm" | "google";
};

function parseTimeFromIso(iso: string): string | null {
  if (!iso.includes("T")) return null;
  return iso.slice(11, 16);
}

function buildTitle(lead: Lead, google?: GoogleCalendarEventRow): string {
  if (google?.summary) {
    return google.summary
      .replace(/^🏁 REALIZADO · /, "")
      .replace(/^✅ QUITADO · /, "");
  }
  if (lead.event_type) return `🎉 ${lead.event_type} — ${lead.name}`;
  return lead.name;
}

function googleMatchesLead(g: GoogleCalendarEventRow, lead: Lead): boolean {
  if (lead.google_event_id && lead.google_event_id === g.id) return true;
  const gDate = g.start.slice(0, 10);
  if (!lead.event_date || lead.event_date !== gDate) return false;
  const nameFromTitle = extractClientNameFromSummary(g.summary);
  if (!nameFromTitle) return false;
  return lead.name.toLowerCase() === nameFromTitle.toLowerCase();
}

export function mergeAgendaEvents(
  leads: Lead[],
  googleEvents: GoogleCalendarEventRow[],
  payments: Record<string, LeadPaymentSummary>,
  suppressedLeads: Lead[] = []
): AgendaEvent[] {
  const googleById = new Map(googleEvents.map((g) => [g.id, g]));
  const usedGoogleIds = new Set<string>();
  const result: AgendaEvent[] = [];

  const allLeadsForMatch = [...leads, ...suppressedLeads];

  for (const lead of leads) {
    if (!lead.event_date) continue;

    let google = lead.google_event_id
      ? googleById.get(lead.google_event_id)
      : undefined;

    if (!google) {
      google = googleEvents.find((g) => googleMatchesLead(g, lead));
    }

    if (google) usedGoogleIds.add(google.id);

    const pay = payments[lead.id] ?? null;
    const isPaid = pay?.status === "paid";

    result.push({
      id: lead.id,
      leadId: lead.id,
      googleEventId: google?.id ?? lead.google_event_id,
      title: buildTitle(lead, google),
      description: google?.description ?? lead.observations,
      eventDate: lead.event_date,
      startTime:
        lead.event_start_time ??
        (google ? parseTimeFromIso(google.start) : null),
      endTime:
        lead.event_end_time ?? (google ? parseTimeFromIso(google.end) : null),
      isAllDay: google?.isAllDay ?? false,
      htmlLink: google?.htmlLink ?? null,
      isPaid,
      paymentSummary: pay,
      status: lead.status,
      clientName: lead.name,
      whatsapp: lead.whatsapp,
      eventType: lead.event_type,
      location: lead.location,
      neighborhood: lead.neighborhood,
      guestCount: lead.guest_count,
      slotsLabel: formatSlotsLabel(lead.slot_types, lead.slot_type),
      source: "crm",
    });
  }

  for (const g of googleEvents) {
    if (usedGoogleIds.has(g.id)) continue;

    const matchedSuppressed = allLeadsForMatch.find((l) => googleMatchesLead(g, l));
    if (matchedSuppressed) continue;

    const date = g.start.slice(0, 10);
    result.push({
      id: `google-${g.id}`,
      leadId: null,
      googleEventId: g.id,
      title: g.summary,
      description: g.description ?? null,
      eventDate: date,
      startTime: parseTimeFromIso(g.start),
      endTime: parseTimeFromIso(g.end),
      isAllDay: g.isAllDay,
      htmlLink: g.htmlLink ?? null,
      isPaid: g.summary.includes("QUITADO"),
      paymentSummary: null,
      status: null,
      clientName: extractClientNameFromSummary(g.summary) ?? g.summary,
      whatsapp: null,
      eventType: null,
      location: null,
      neighborhood: null,
      guestCount: null,
      slotsLabel: null,
      source: "google",
    });
  }

  return result.sort((a, b) => {
    const da = `${a.eventDate}T${a.startTime ?? "00:00"}`;
    const db = `${b.eventDate}T${b.startTime ?? "00:00"}`;
    return da.localeCompare(db);
  });
}

export function parseEventDescription(description: string | null): Record<string, string> {
  if (!description) return {};
  const lines = description.split("\n");
  const out: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key && val) out[key] = val;
    }
  }
  return out;
}
