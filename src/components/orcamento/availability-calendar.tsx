"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SLOT_LABELS, type SlotType } from "@/lib/slots";

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedSlot: SlotType | "";
  onSelectSlot: (slot: SlotType) => void;
}

export function AvailabilityCalendar({
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dayStatus, setDayStatus] = useState<
    Record<string, "available" | "partial" | "full">
  >({});
  const [availableSlots, setAvailableSlots] = useState<
    { slot: string; available: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/availability?month=${currentMonth}`);
      const data = await res.json();
      setDayStatus(data.days ?? {});
      setLoading(false);
    };
    load();
  }, [currentMonth]);

  useEffect(() => {
    if (!selectedDate) return;
    const load = async () => {
      const res = await fetch(`/api/availability?date=${selectedDate}`);
      const data = await res.json();
      setAvailableSlots(data.slots ?? []);
    };
    load();
  }, [selectedDate]);

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

  const monthLabel = new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const formSlots = availableSlots.filter(
    (s) => s.available && s.slot !== "dia_todo"
  );

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={prevMonth} aria-label="Mês anterior">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-display text-sm font-bold capitalize text-foreground sm:text-base">
          {monthLabel}
        </span>
        <Button type="button" variant="ghost" size="icon" onClick={nextMonth} aria-label="Próximo mês">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-2xs font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "grid grid-cols-7 gap-1 sm:gap-1.5",
          loading && "pointer-events-none opacity-50"
        )}
      >
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = dayStatus[dateStr] ?? "available";
          const isPast = dateStr < today;
          const disabled = isPast || status === "full";
          const selected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "relative flex aspect-square min-h-[40px] w-full items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 sm:min-h-[44px]",
                disabled && "cursor-not-allowed opacity-35 text-muted-foreground",
                selected && "bg-primary text-primary-foreground shadow-warm",
                !selected && !disabled && "bg-card text-foreground hover:bg-primary/10",
                status === "partial" && !selected && "ring-2 ring-accent ring-inset"
              )}
            >
              {day}
              {status === "partial" && !selected && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-accent" />
              )}
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

      {selectedDate && formSlots.length > 0 && (
        <div className="space-y-2 border-t border-border/60 pt-4">
          <p className="text-sm font-semibold text-foreground">Horário do evento *</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {formSlots.map((s) => (
              <button
                key={s.slot}
                type="button"
                onClick={() => onSelectSlot(s.slot as SlotType)}
                className={cn(
                  "min-h-[48px] rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200",
                  selectedSlot === s.slot
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-card text-foreground hover:border-primary/40"
                )}
              >
                {SLOT_LABELS[s.slot as SlotType]}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && formSlots.length === 0 && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          Nenhum turno disponível nesta data. Escolha outra data.
        </p>
      )}
    </div>
  );
}
