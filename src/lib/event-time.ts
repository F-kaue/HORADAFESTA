/** Soma horas a um horário HH:MM */
export function addHoursToTime(time: string, hours: number): string {
  const parts = time.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const totalMinutes = h * 60 + m + Math.round(hours * 60);
  const nh = Math.floor(totalMinutes / 60) % 24;
  const nm = totalMinutes % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function formatTimeRange(
  start?: string | null,
  end?: string | null
): string {
  const s = start?.slice(0, 5);
  const e = end?.slice(0, 5);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return "";
}

export function formatLeadSchedule(lead: {
  event_date?: string | null;
  event_start_time?: string | null;
  event_end_time?: string | null;
}): string {
  const time = formatTimeRange(lead.event_start_time, lead.event_end_time);
  return time;
}

export function normalizeTimeInput(value: string): string {
  if (!value) return "";
  return value.slice(0, 5);
}
