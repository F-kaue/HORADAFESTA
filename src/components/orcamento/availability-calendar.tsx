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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-display font-semibold capitalize">{monthLabel}</span>
        <Button type="button" variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div
        className={cn(
          "grid grid-cols-7 gap-1",
          loading && "opacity-50 pointer-events-none"
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
                "relative flex h-10 w-full items-center justify-center rounded-lg text-sm transition-all duration-200",
                disabled && "cursor-not-allowed opacity-40",
                selected && "bg-primary text-white shadow-warm",
                !selected && !disabled && "hover:bg-muted",
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

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-success" /> Disponível
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent" /> Parcial
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-danger" /> Lotado
        </span>
      </div>

      {selectedDate && formSlots.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">🕢 Horário do evento</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {formSlots.map((s) => (
              <button
                key={s.slot}
                type="button"
                onClick={() => onSelectSlot(s.slot as SlotType)}
                className={cn(
                  "rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px]",
                  selectedSlot === s.slot
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input hover:border-primary/50"
                )}
              >
                {SLOT_LABELS[s.slot as SlotType]}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && formSlots.length === 0 && (
        <p className="text-sm text-danger">
          Nenhum turno disponível nesta data. Escolha outra data.
        </p>
      )}
    </div>
  );
}
