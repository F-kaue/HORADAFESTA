export type SlotType = "manha" | "tarde" | "noite" | "dia_todo";

export const SLOT_LABELS: Record<SlotType, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  dia_todo: "Dia todo",
};

export const SLOT_TIMES: Record<SlotType, { start: string; end: string }> = {
  manha: { start: "08:00", end: "12:00" },
  tarde: { start: "12:00", end: "18:00" },
  noite: { start: "18:00", end: "23:59" },
  dia_todo: { start: "00:00", end: "23:59" },
};

export const ALL_SLOTS: SlotType[] = ["manha", "tarde", "noite"];

export interface SlotAvailability {
  slot: SlotType;
  available: boolean;
}

export function computeAvailability(
  occupied: SlotType[]
): SlotAvailability[] {
  const hasDiaTodo = occupied.includes("dia_todo");
  const hasManha = occupied.includes("manha");
  const hasTarde = occupied.includes("tarde");
  const hasNoite = occupied.includes("noite");

  return [
    { slot: "manha", available: !(hasDiaTodo || hasManha) },
    { slot: "tarde", available: !(hasDiaTodo || hasTarde) },
    { slot: "noite", available: !(hasDiaTodo || hasNoite) },
    {
      slot: "dia_todo",
      available: !(hasDiaTodo || hasManha || hasTarde || hasNoite),
    },
  ];
}

export function dayStatus(
  occupied: SlotType[]
): "available" | "partial" | "full" {
  const slots = computeAvailability(occupied);
  const availableCount = slots.filter(
    (s) => s.slot !== "dia_todo" && s.available
  ).length;
  if (availableCount === 3) return "available";
  if (availableCount === 0) return "full";
  return "partial";
}
