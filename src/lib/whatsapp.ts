import { SLOT_LABELS, type SlotType } from "./slots";
import { formatDate } from "./utils";

export interface LeadWhatsAppData {
  name: string;
  eventDate?: string | null;
  slotType?: string | null;
  location?: string | null;
  neighborhood?: string | null;
  guestCount?: number | null;
  eventType?: string | null;
  observations?: string | null;
}

export function buildOrcamentoMessage(data: LeadWhatsAppData): string {
  const location = [data.location, data.neighborhood]
    .filter(Boolean)
    .join(" - ");
  const datePart = data.eventDate
    ? `${formatDate(data.eventDate)}${
        data.slotType
          ? ` (${SLOT_LABELS[data.slotType as SlotType] ?? data.slotType})`
          : ""
      }`
    : "A definir";

  const lines = [
    "Olá! Vim pelo formulário de orçamento 🎉",
    "",
    `*Nome:* ${data.name}`,
    `*Data do evento:* ${datePart}`,
    `*Local:* ${location || "—"}`,
    `*Convidados:* ~${data.guestCount ?? "—"} pessoas`,
    `*Tipo:* ${data.eventType ?? "—"}`,
  ];

  if (data.observations?.trim()) {
    lines.push(`*Observações:* ${data.observations.trim()}`);
  }

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
