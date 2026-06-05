"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import {
  availabilityMap,
  formatSlotsLabel,
  SLOT_LABELS,
  toggleSlotSelection,
  type SlotType,
} from "@/lib/slots";

interface BaseProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  excludeLeadId?: string;
}

interface SingleSelectProps extends BaseProps {
  multiSelect?: false;
  selectedSlot: SlotType | "";
  onSelectSlot: (slot: SlotType) => void;
}

interface MultiSelectProps extends BaseProps {
  multiSelect: true;
  selectedSlots: SlotType[];
  onChangeSlots: (slots: SlotType[]) => void;
}

type Props = SingleSelectProps | MultiSelectProps;

const SLOT_ORDER: SlotType[] = ["manha", "tarde", "noite", "dia_todo"];

export function AvailabilityCalendar(props: Props) {
  const { selectedDate, onSelectDate, excludeLeadId } = props;
  const multiSelect = props.multiSelect === true;

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dayStatus, setDayStatus] = useState<
    Record<string, "available" | "partial" | "full">
  >({});
  const [availableSlots, setAvailableSlots] = useState<
    { slot: string; available: boolean }[]
  >([]);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

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

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }
    const load = async () => {
      setLoadingSlots(true);
      const params = new URLSearchParams({ date: selectedDate });
      if (excludeLeadId) params.set("exclude_lead_id", excludeLeadId);
      const res = await fetch(`/api/availability?${params}`);
      const data = await res.json();
      setAvailableSlots(data.slots ?? []);
      setLoadingSlots(false);
    };
    load();
  }, [selectedDate, excludeLeadId]);

  const availMap = useMemo(() => availabilityMap(availableSlots), [availableSlots]);

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

  const formSlots = multiSelect
    ? SLOT_ORDER.map((slot) => ({ slot, available: availMap[slot] ?? false }))
    : availableSlots.filter((s) => s.available && s.slot !== "dia_todo");

  const selectedSlots = multiSelect ? (props.selectedSlots ?? []) : [];
  const selectionLabel = multiSelect ? formatSlotsLabel(selectedSlots) : "";

  const handleDatePick = (dateStr: string) => {
    onSelectDate(dateStr);
    if (multiSelect) props.onChangeSlots?.([]);
  };

  const handleSlotClick = (slot: SlotType, isAvailable: boolean) => {
    if (multiSelect) {
      if (!isAvailable && !selectedSlots.includes(slot)) return;
      props.onChangeSlots?.(
        toggleSlotSelection(selectedSlots, slot, availMap)
      );
      return;
    }
    if (!isAvailable) return;
    props.onSelectSlot?.(slot);
  };

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
          loadingMonth && "pointer-events-none opacity-50"
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
              onClick={() => handleDatePick(dateStr)}
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

      {selectedDate && (
        <p className="text-sm font-semibold text-foreground">
          Data: {formatDate(selectedDate)}
        </p>
      )}

      {selectedDate && formSlots.length > 0 && (
        <div
          className={cn(
            "space-y-2 border-t border-border/60 pt-4",
            loadingSlots && "opacity-60"
          )}
        >
          <p className="text-sm font-semibold text-foreground">
            {multiSelect
              ? "Turnos do evento * (pode escolher mais de um)"
              : "Horário do evento *"}
          </p>
          {multiSelect && (
            <p className="text-xs text-muted-foreground">
              Turnos já reservados por outros eventos aparecem bloqueados. Combine
              Manhã + Tarde, Tarde + Noite, ou use Dia todo se estiver livre.
            </p>
          )}
          <div
            className={cn(
              "grid gap-2",
              multiSelect ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
            )}
          >
            {formSlots.map((s) => {
              const slot = s.slot as SlotType;
              const isAvailable = s.available;
              const isSelected = multiSelect
                ? selectedSlots.includes(slot)
                : props.selectedSlot === slot;

              return (
                <button
                  key={s.slot}
                  type="button"
                  disabled={!multiSelect && !isAvailable}
                  onClick={() => handleSlotClick(slot, isAvailable)}
                  className={cn(
                    "min-h-[48px] rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200",
                    isSelected &&
                      "border-primary bg-primary/10 text-primary",
                    !isSelected &&
                      isAvailable &&
                      "border-input bg-card text-foreground hover:border-primary/40",
                    !isSelected &&
                      !isAvailable &&
                      "cursor-not-allowed border-input/50 bg-muted/50 text-muted-foreground opacity-70"
                  )}
                >
                  {SLOT_LABELS[slot]}
                  {!isAvailable && (
                    <span className="mt-0.5 block text-2xs font-bold uppercase text-danger">
                      Ocupado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {multiSelect && selectionLabel && (
            <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
              Selecionado: {selectionLabel}
            </p>
          )}
        </div>
      )}

      {selectedDate && !loadingSlots && formSlots.every((s) => !s.available) && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          Nenhum turno disponível nesta data. Escolha outra data.
        </p>
      )}
    </div>
  );
}
