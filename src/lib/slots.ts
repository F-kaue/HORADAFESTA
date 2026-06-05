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
export const PERIOD_SLOTS: SlotType[] = ["manha", "tarde", "noite"];

export interface SlotAvailability {
  slot: SlotType;
  available: boolean;
}

const VALID_SLOTS = new Set<string>(["manha", "tarde", "noite", "dia_todo"]);

function isSlotType(value: unknown): value is SlotType {
  return typeof value === "string" && VALID_SLOTS.has(value);
}

/** Normaliza slot_types do Supabase (array, string PG, ou slot_type único) */
export function parseLeadSlotTypes(
  slotTypes: unknown,
  fallback?: SlotType | null
): SlotType[] {
  if (Array.isArray(slotTypes)) {
    const fromArray = slotTypes.filter(isSlotType);
    if (fromArray.length > 0) return normalizeSlotSelection(fromArray);
  }

  if (typeof slotTypes === "string") {
    const trimmed = slotTypes.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const inner = trimmed.slice(1, -1).trim();
      if (!inner) return fallback && isSlotType(fallback) ? [fallback] : [];
      const fromPg = inner
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, ""))
        .filter(isSlotType);
      if (fromPg.length > 0) return normalizeSlotSelection(fromPg);
    }
    if (isSlotType(trimmed)) return [trimmed];
  }

  return fallback && isSlotType(fallback) ? [fallback] : [];
}

/** Rótulo para um ou vários turnos (ex.: "Manhã + Tarde") */
export function formatSlotsLabel(
  slots: unknown,
  fallback?: SlotType | null
): string {
  const list = parseLeadSlotTypes(slots, fallback);
  if (list.length === 0) return "";
  if (list.includes("dia_todo")) return SLOT_LABELS.dia_todo;
  return PERIOD_SLOTS.filter((s) => list.includes(s))
    .map((s) => SLOT_LABELS[s])
    .join(" + ");
}

export function normalizeSlotSelection(selected: SlotType[]): SlotType[] {
  if (!Array.isArray(selected)) return [];
  if (selected.includes("dia_todo")) return ["dia_todo"];
  return PERIOD_SLOTS.filter((s) => selected.includes(s));
}

export function availabilityMap(
  rows: { slot: string; available: boolean }[]
): Record<SlotType, boolean> {
  const map = {} as Record<SlotType, boolean>;
  for (const row of rows) {
    map[row.slot as SlotType] = row.available;
  }
  return map;
}

export function toggleSlotSelection(
  current: SlotType[],
  slot: SlotType,
  available: Record<SlotType, boolean>
): SlotType[] {
  if (slot === "dia_todo") {
    if (current.includes("dia_todo")) return [];
    if (!available.dia_todo) return current;
    return ["dia_todo"];
  }

  let next = current.filter((s) => s !== "dia_todo");
  if (next.includes(slot)) {
    next = next.filter((s) => s !== slot);
  } else if (available[slot]) {
    next = [...next, slot];
  }
  return normalizeSlotSelection(next);
}

/** Horário sugerido ao combinar vários turnos */
export function derivedEventTimes(
  slots: SlotType[],
  customStart?: string,
  customEnd?: string
): { start: string; end: string } {
  if (customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }
  const normalized = normalizeSlotSelection(slots);
  if (normalized.includes("dia_todo")) {
    return {
      start: customStart || SLOT_TIMES.dia_todo.start,
      end: customEnd || SLOT_TIMES.dia_todo.end,
    };
  }
  if (normalized.length === 0) {
    return { start: customStart || "08:00", end: customEnd || "18:00" };
  }
  const starts = normalized.map((s) => SLOT_TIMES[s].start);
  const ends = normalized.map((s) => SLOT_TIMES[s].end);
  return {
    start: customStart || starts.sort()[0],
    end: customEnd || ends.sort().reverse()[0],
  };
}

export function validateSlotsAgainstOccupied(
  requested: SlotType[],
  occupied: SlotType[]
): { ok: true } | { ok: false; slot: SlotType } {
  const normalized = normalizeSlotSelection(requested);
  if (normalized.length === 0) {
    return { ok: false, slot: "manha" };
  }
  const availability = computeAvailability(occupied);
  for (const slot of normalized) {
    const row = availability.find((a) => a.slot === slot);
    if (!row?.available) return { ok: false, slot };
  }
  return { ok: true };
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
