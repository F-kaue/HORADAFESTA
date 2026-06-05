"use client";

import {
  addDays,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MonthGridProps {
  month: Date;
  selectedDate: string | null;
  eventDates: Set<string>;
  onSelectDate: (date: string | null) => void;
}

export function MonthGrid({
  month,
  selectedDate,
  eventDates,
  onSelectDate,
}: MonthGridProps) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-card sm:p-4">
      <div className="mb-3 grid grid-cols-7 gap-1 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-2xs font-bold uppercase text-muted-foreground"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const hasEvent = eventDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                !inMonth && "text-muted-foreground/40",
                inMonth && "text-foreground hover:bg-muted",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isToday && !isSelected && "ring-2 ring-primary/40"
              )}
            >
              {format(day, "d")}
              {hasEvent && inMonth && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-2xs font-semibold text-muted-foreground">
        {format(month, "MMMM yyyy", { locale: ptBR })}
      </p>
    </div>
  );
}

export function monthRange(month: Date) {
  const start = format(startOfMonth(month), "yyyy-MM-dd");
  const end = format(endOfMonth(month), "yyyy-MM-dd");
  return { start, end };
}
