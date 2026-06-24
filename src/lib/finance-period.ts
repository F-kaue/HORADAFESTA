export type FinancePeriodMode = "week" | "month";

export type FinancePeriodRange = {
  from: string;
  to: string;
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Segunda-feira da semana que contém a data */
export function getWeekStart(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getPeriodRange(
  mode: FinancePeriodMode,
  anchorDate = new Date()
): FinancePeriodRange {
  if (mode === "month") {
    const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }

  const start = getWeekStart(anchorDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { from: toIsoDate(start), to: toIsoDate(end) };
}

export function getDefaultPeriodRange(
  mode: FinancePeriodMode = "week"
): FinancePeriodRange {
  return getPeriodRange(mode);
}

export function shiftPeriod(
  range: FinancePeriodRange,
  mode: FinancePeriodMode,
  direction: -1 | 1
): FinancePeriodRange {
  const anchor = parseIsoDate(range.from);
  if (mode === "month") {
    anchor.setMonth(anchor.getMonth() + direction);
  } else {
    anchor.setDate(anchor.getDate() + direction * 7);
  }
  return getPeriodRange(mode, anchor);
}

export function isDateInRange(
  date: string | null | undefined,
  range: FinancePeriodRange
): boolean {
  if (!date) return false;
  return date >= range.from && date <= range.to;
}

export function formatPeriodLabel(
  range: FinancePeriodRange,
  mode: FinancePeriodMode
): string {
  const from = parseIsoDate(range.from);
  const to = parseIsoDate(range.to);

  if (mode === "month") {
    return from.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  const sameMonth = from.getMonth() === to.getMonth();
  const fromLabel = from.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: sameMonth ? "2-digit" : "short",
  });
  const toLabel = to.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: from.getFullYear() !== to.getFullYear() ? "numeric" : undefined,
  });
  return `${fromLabel} – ${toLabel}`;
}

export function formatPeriodModeLabel(mode: FinancePeriodMode): string {
  return mode === "week" ? "Semana" : "Mês";
}

/** Gera buckets diários (semana) ou semanais (mês) para gráficos */
export function buildPeriodChartBuckets(
  range: FinancePeriodRange,
  mode: FinancePeriodMode
): { key: string; label: string; from: string; to: string }[] {
  if (mode === "week") {
    const buckets: { key: string; label: string; from: string; to: string }[] = [];
    const cursor = parseIsoDate(range.from);
    for (let i = 0; i < 7; i += 1) {
      const iso = toIsoDate(cursor);
      buckets.push({
        key: iso,
        label: cursor.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        from: iso,
        to: iso,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return buckets;
  }

  const buckets: { key: string; label: string; from: string; to: string }[] = [];
  const monthStart = parseIsoDate(range.from);
  const monthEnd = parseIsoDate(range.to);
  const cursor = getWeekStart(monthStart);
  if (cursor < monthStart) cursor.setDate(cursor.getDate() + 7);

  while (cursor <= monthEnd) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const from = toIsoDate(weekStart < monthStart ? monthStart : weekStart);
    const to = toIsoDate(weekEnd > monthEnd ? monthEnd : weekEnd);
    buckets.push({
      key: from,
      label: `${parseIsoDate(from).getDate()}–${parseIsoDate(to).getDate()}`,
      from,
      to,
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  if (buckets.length === 0) {
    buckets.push({
      key: range.from,
      label: "Período",
      from: range.from,
      to: range.to,
    });
  }

  return buckets;
}
