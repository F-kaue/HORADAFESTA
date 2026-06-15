"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FinanceStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "emerald" | "sky" | "amber" | "rose" | "violet" | "primary";
};

const toneStyles = {
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-card dark:border-emerald-800/50",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    value: "text-emerald-900 dark:text-emerald-100",
  },
  sky: {
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-card dark:border-sky-800/50",
    icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    value: "text-sky-900 dark:text-sky-100",
  },
  amber: {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-card dark:border-amber-800/50",
    icon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    value: "text-amber-900 dark:text-amber-100",
  },
  rose: {
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-card dark:border-rose-800/50",
    icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    value: "text-rose-900 dark:text-rose-100",
  },
  violet: {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-card dark:border-violet-800/50",
    icon: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    value: "text-violet-900 dark:text-violet-100",
  },
  primary: {
    card: "border-primary/25 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-card",
    icon: "bg-primary/15 text-primary",
    value: "text-foreground",
  },
};

export function FinanceStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: FinanceStatCardProps) {
  const s = toneStyles[tone];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
        s.card
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn("mt-2 font-display text-xl font-bold tabular-nums sm:text-2xl", s.value)}>
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            s.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
