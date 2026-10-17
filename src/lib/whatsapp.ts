import { formatDate } from "./utils";
import { formatTimeRange } from "./event-time";

export interface LeadWhatsAppData {
  name: string;
  whatsapp?: string | null;
  instagram?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  serviceType?: string | null;
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
  const timeRange = formatTimeRange(data.startTime, data.endTime);
  const datePart = data.eventDate
    ? `${formatDate(data.eventDate)}${timeRange ? ` · ${timeRange}` : ""}`
    : "A definir";

  const instagram = data.instagram?.trim()
    ? data.instagram.trim().startsWith("@")
      ? data.instagram.trim()
      : `@${data.instagram.trim()}`
    : null;

  const lines = [
    "Olá! Vim pelo formulário de orçamento 🎉",
    "",
    `*Nome:* ${data.name}`,
    ...(data.whatsapp ? [`*WhatsApp:* ${data.whatsapp}`] : []),
    ...(instagram ? [`*Instagram:* ${instagram}`] : []),
    `*Data do evento:* ${datePart}`,
    ...(data.serviceType ? [`*Serviço:* ${data.serviceType}`] : []),
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
  // api.whatsapp.com abre o app no celular e o WhatsApp Web no computador
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
}
