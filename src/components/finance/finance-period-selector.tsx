"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatPeriodLabel,
  formatPeriodModeLabel,
  shiftPeriod,
  type FinancePeriodMode,
  type FinancePeriodRange,
} from "@/lib/finance-period";
import { cn } from "@/lib/utils";

type FinancePeriodSelectorProps = {
  mode: FinancePeriodMode;
  range: FinancePeriodRange;
  onModeChange: (mode: FinancePeriodMode) => void;
  onRangeChange: (range: FinancePeriodRange) => void;
  className?: string;
};

export function FinancePeriodSelector({
  mode,
  range,
  onModeChange,
  onRangeChange,
  className,
}: FinancePeriodSelectorProps) {
  const go = (direction: -1 | 1) => {
    onRangeChange(shiftPeriod(range, mode, direction));
  };

  const setMode = (next: FinancePeriodMode) => {
    onModeChange(next);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span className="font-semibold text-foreground">Período:</span>
        <span className="capitalize text-muted-foreground">
          {formatPeriodLabel(range, mode)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-border/80 bg-muted/30 p-1">
          {(["week", "month"] as FinancePeriodMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                mode === option
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {formatPeriodModeLabel(option)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => go(-1)}
            aria-label="Período anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => go(1)}
            aria-label="Próximo período"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
