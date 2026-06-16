"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

interface AvailabilityCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  excludeLeadId?: string;
  /** Libera datas passadas e lotadas — apenas no CRM (não no formulário público) */
  internalMode?: boolean;
}

export function AvailabilityCalendar({
  selectedDate,
  onSelectDate,
  internalMode = false,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dayStatus, setDayStatus] = useState<
    Record<string, "available" | "partial" | "full">
  >({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    const d = new Date(selectedDate + "T12:00:00");
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setCurrentMonth((prev) => (prev === m ? prev : m));
  }, [selectedDate]);

  useEffect(() => {
    const load = async () => {
      setLoadingMonth(true);
      const res = await fetch(`/api/availability?month=${currentMonth}`);
      const data = await res.json();
      setDayStatus(data.days ?? {});
      setLoadingMonth(false);
    };
    load();
  }, [currentMonth]);

  const [year, month] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const today = new Date().toISOString().slice(0, 10);

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-sm font-bold capitalize text-foreground">
          {monthLabel}
        </span>
        <Button type="button" variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={cn(
          "grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground",
          loadingMonth && "opacity-60"
        )}
      >
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={`${d}-${i}`} className="py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = dayStatus[dateStr] ?? "available";
          const isPast = dateStr < today;
          const isSelected = selectedDate === dateStr;
          const disabled = internalMode ? false : isPast || status === "full";

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "relative flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all",
                isSelected && "bg-primary text-primary-foreground shadow-sm",
                !isSelected &&
                  !disabled &&
                  status === "available" &&
                  "bg-success/10 text-success hover:bg-success/20",
                !isSelected &&
                  !disabled &&
                  status === "partial" &&
                  "bg-accent/15 text-accent-foreground hover:bg-accent/25",
                !isSelected &&
                  internalMode &&
                  isPast &&
                  "bg-muted/30 text-muted-foreground hover:bg-muted/50",
                !isSelected &&
                  internalMode &&
                  !isPast &&
                  status === "full" &&
                  "bg-danger/10 text-danger hover:bg-danger/20",
                !isSelected &&
                  disabled &&
                  "cursor-not-allowed bg-muted/40 text-muted-foreground opacity-60"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success" /> Disponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Parcial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" /> Lotado
        </span>
      </div>

      {internalMode && (
        <p className="text-xs text-muted-foreground">
          No sistema você pode escolher qualquer data, inclusive retroativa ou lotada.
        </p>
      )}

      {selectedDate && (
        <p className="text-sm font-semibold text-foreground">
          Data selecionada: {formatDate(selectedDate)}
        </p>
      )}
    </div>
  );
}
