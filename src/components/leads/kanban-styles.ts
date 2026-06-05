import type { LeadStatus } from "@/types/database";

/** Classes estáticas (Tailwind precisa vê-las no código, não em strings dinâmicas) */
export const KANBAN_COLUMN_STYLES: Record<
  LeadStatus,
  {
    header: string;
    body: string;
    badge: string;
    tabActive: string;
    tabInactive: string;
  }
> = {
  novo: {
    header: "bg-blue-600 text-white shadow-md ring-1 ring-blue-700/30",
    body: "bg-blue-50/90 border-2 border-dashed border-blue-200",
    badge: "bg-blue-100 text-blue-900 border border-blue-200",
    tabActive: "bg-blue-600 text-white shadow-md",
    tabInactive: "bg-blue-50 text-blue-900 border-2 border-blue-200",
  },
  em_conversa: {
    header: "bg-amber-600 text-white shadow-md ring-1 ring-amber-700/30",
    body: "bg-amber-50/90 border-2 border-dashed border-amber-200",
    badge: "bg-amber-100 text-amber-900 border border-amber-200",
    tabActive: "bg-amber-600 text-white shadow-md",
    tabInactive: "bg-amber-50 text-amber-900 border-2 border-amber-200",
  },
  aguardando: {
    header: "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30",
    body: "bg-orange-50/90 border-2 border-dashed border-orange-200",
    badge: "bg-orange-100 text-orange-900 border border-orange-200",
    tabActive: "bg-primary text-primary-foreground shadow-md",
    tabInactive: "bg-orange-50 text-orange-900 border-2 border-orange-200",
  },
  confirmado: {
    header: "bg-emerald-600 text-white shadow-md ring-1 ring-emerald-700/30",
    body: "bg-emerald-50/90 border-2 border-dashed border-emerald-200",
    badge: "bg-emerald-100 text-emerald-900 border border-emerald-200",
    tabActive: "bg-emerald-600 text-white shadow-md",
    tabInactive: "bg-emerald-50 text-emerald-900 border-2 border-emerald-200",
  },
  nao_convertido: {
    header: "bg-red-600 text-white shadow-md ring-1 ring-red-700/30",
    body: "bg-red-50/90 border-2 border-dashed border-red-200",
    badge: "bg-red-100 text-red-900 border border-red-200",
    tabActive: "bg-red-600 text-white shadow-md",
    tabInactive: "bg-red-50 text-red-900 border-2 border-red-200",
  },
};

export const KANBAN_CARD_ACCENT: Record<LeadStatus, string> = {
  novo: "border-l-4 border-l-blue-600",
  em_conversa: "border-l-4 border-l-amber-600",
  aguardando: "border-l-4 border-l-primary",
  confirmado: "border-l-4 border-l-emerald-600",
  nao_convertido: "border-l-4 border-l-red-600",
};
