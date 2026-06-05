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
    emptyTitle: string;
    emptySubtitle: string;
    emptyIcon: string;
  }
> = {
  novo: {
    header: "bg-blue-600 text-white shadow-md ring-1 ring-blue-700/30",
    body: "bg-blue-50/90 dark:bg-blue-950/50 border-2 border-dashed border-blue-200 dark:border-blue-800/80",
    badge: "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/60 dark:text-blue-100 dark:border-blue-700",
    tabActive: "bg-blue-600 text-white shadow-md",
    tabInactive:
      "bg-blue-50 text-blue-900 border-2 border-blue-200 dark:bg-blue-950/60 dark:text-blue-100 dark:border-blue-800",
    emptyTitle: "text-blue-900 dark:text-blue-100",
    emptySubtitle: "text-blue-800/80 dark:text-blue-200/80",
    emptyIcon: "text-blue-500/60 dark:text-blue-300/70",
  },
  em_conversa: {
    header: "bg-amber-600 text-white shadow-md ring-1 ring-amber-700/30",
    body: "bg-amber-50/90 dark:bg-amber-950/50 border-2 border-dashed border-amber-200 dark:border-amber-800/80",
    badge: "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/60 dark:text-amber-100 dark:border-amber-700",
    tabActive: "bg-amber-600 text-white shadow-md",
    tabInactive:
      "bg-amber-50 text-amber-900 border-2 border-amber-200 dark:bg-amber-950/60 dark:text-amber-100 dark:border-amber-800",
    emptyTitle: "text-amber-900 dark:text-amber-100",
    emptySubtitle: "text-amber-800/80 dark:text-amber-200/80",
    emptyIcon: "text-amber-500/60 dark:text-amber-300/70",
  },
  aguardando: {
    header: "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30",
    body: "bg-orange-50/90 dark:bg-orange-950/45 border-2 border-dashed border-orange-200 dark:border-orange-800/80",
    badge: "bg-orange-100 text-orange-900 border border-orange-200 dark:bg-orange-900/60 dark:text-orange-100 dark:border-orange-700",
    tabActive: "bg-primary text-primary-foreground shadow-md",
    tabInactive:
      "bg-orange-50 text-orange-900 border-2 border-orange-200 dark:bg-orange-950/60 dark:text-orange-100 dark:border-orange-800",
    emptyTitle: "text-orange-900 dark:text-orange-100",
    emptySubtitle: "text-orange-800/80 dark:text-orange-200/80",
    emptyIcon: "text-orange-500/60 dark:text-orange-300/70",
  },
  confirmado: {
    header: "bg-emerald-600 text-white shadow-md ring-1 ring-emerald-700/30",
    body: "bg-emerald-50/90 dark:bg-emerald-950/50 border-2 border-dashed border-emerald-200 dark:border-emerald-800/80",
    badge: "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-100 dark:border-emerald-700",
    tabActive: "bg-emerald-600 text-white shadow-md",
    tabInactive:
      "bg-emerald-50 text-emerald-900 border-2 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-800",
    emptyTitle: "text-emerald-900 dark:text-emerald-100",
    emptySubtitle: "text-emerald-800/80 dark:text-emerald-200/80",
    emptyIcon: "text-emerald-500/60 dark:text-emerald-300/70",
  },
  finalizado: {
    header: "bg-violet-600 text-white shadow-md ring-1 ring-violet-700/30",
    body: "bg-violet-50/90 dark:bg-violet-950/50 border-2 border-dashed border-violet-200 dark:border-violet-800/80",
    badge: "bg-violet-100 text-violet-900 border border-violet-200 dark:bg-violet-900/60 dark:text-violet-100 dark:border-violet-700",
    tabActive: "bg-violet-600 text-white shadow-md",
    tabInactive:
      "bg-violet-50 text-violet-900 border-2 border-violet-200 dark:bg-violet-950/60 dark:text-violet-100 dark:border-violet-800",
    emptyTitle: "text-violet-900 dark:text-violet-100",
    emptySubtitle: "text-violet-800/80 dark:text-violet-200/80",
    emptyIcon: "text-violet-500/60 dark:text-violet-300/70",
  },
  nao_convertido: {
    header: "bg-red-600 text-white shadow-md ring-1 ring-red-700/30",
    body: "bg-red-50/90 dark:bg-red-950/50 border-2 border-dashed border-red-200 dark:border-red-800/80",
    badge: "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/60 dark:text-red-100 dark:border-red-700",
    tabActive: "bg-red-600 text-white shadow-md",
    tabInactive:
      "bg-red-50 text-red-900 border-2 border-red-200 dark:bg-red-950/60 dark:text-red-100 dark:border-red-800",
    emptyTitle: "text-red-900 dark:text-red-100",
    emptySubtitle: "text-red-800/80 dark:text-red-200/80",
    emptyIcon: "text-red-500/60 dark:text-red-300/70",
  },
};

export const KANBAN_CARD_ACCENT: Record<LeadStatus, string> = {
  novo: "border-l-4 border-l-blue-600",
  em_conversa: "border-l-4 border-l-amber-600",
  aguardando: "border-l-4 border-l-primary",
  confirmado: "border-l-4 border-l-emerald-600",
  finalizado: "border-l-4 border-l-violet-600",
  nao_convertido: "border-l-4 border-l-red-600",
};
