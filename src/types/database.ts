export type LeadStatus =
  | "novo"
  | "em_conversa"
  | "aguardando"
  | "confirmado"
  | "nao_convertido";

export type SlotType = "manha" | "tarde" | "noite" | "dia_todo";

export interface Profile {
  id: string;
  name: string;
  business_name: string;
  phone: string | null;
  whatsapp: string;
  google_calendar_token: Record<string, unknown> | null;
  max_events_per_day: number;
  logo_url: string | null;
  morning_start: string;
  morning_end: string;
  afternoon_start: string;
  afternoon_end: string;
  evening_start: string;
  evening_end: string;
  working_days: number[];
  blocked_dates: string[];
  whatsapp_template: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  event_date: string | null;
  slot_type: SlotType | null;
  event_start_time: string | null;
  event_end_time: string | null;
  location: string | null;
  neighborhood: string | null;
  guest_count: number | null;
  event_type: string | null;
  observations: string | null;
  status: LeadStatus;
  internal_notes: string | null;
  total_value: number | null;
  arrived_at: string;
  confirmed_at: string | null;
  google_event_id: string | null;
  created_at: string;
}

export interface EventSlot {
  id: string;
  event_date: string;
  slot_type: SlotType;
  lead_id: string | null;
  status: string;
  google_event_id: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  lead_id: string;
  total_value: number;
  installments: number;
  installment_value: number | null;
  payment_type: "avista" | "parcelado";
  notes: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  payment_id: string;
  installment_number: number;
  due_date: string | null;
  paid_date: string | null;
  value: number;
  is_paid: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  lead_id: string | null;
  read: boolean;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  lead_id: string;
  from_status: LeadStatus | null;
  to_status: LeadStatus;
  created_at: string;
}

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; emoji: string }
> = {
  novo: { label: "Novo", color: "bg-blue-500", emoji: "🆕" },
  em_conversa: { label: "Em conversa", color: "bg-warning", emoji: "💬" },
  aguardando: { label: "Aguardando", color: "bg-primary", emoji: "⏳" },
  confirmado: { label: "Confirmado", color: "bg-success", emoji: "✅" },
  nao_convertido: { label: "Não convertido", color: "bg-danger", emoji: "❌" },
};

export const EVENT_TYPES = [
  "Aniversário",
  "Casamento",
  "Formatura",
  "Corporativo",
  "Batizado",
  "Outro",
] as const;
