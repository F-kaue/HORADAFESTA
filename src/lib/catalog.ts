import type { SupabaseClient } from "@supabase/supabase-js";

export type EventTypeRow = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

export type ServiceTypeRow = {
  id: string;
  name: string;
  duration_hours: number;
  sort_order: number;
  active: boolean;
};

export async function fetchEventTypes(
  supabase: SupabaseClient,
  activeOnly = true
): Promise<EventTypeRow[]> {
  let q = supabase
    .from("event_types")
    .select("id, name, sort_order, active")
    .order("sort_order")
    .order("name");
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as EventTypeRow[];
}

export async function fetchServiceTypes(
  supabase: SupabaseClient,
  activeOnly = true
): Promise<ServiceTypeRow[]> {
  let q = supabase
    .from("service_types")
    .select("id, name, duration_hours, sort_order, active")
    .order("sort_order")
    .order("name");
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []).map((r) => ({
    ...r,
    duration_hours: Number(r.duration_hours),
  })) as ServiceTypeRow[];
}

export function findServiceDuration(
  services: ServiceTypeRow[],
  name: string | null | undefined
): number | null {
  if (!name) return null;
  const found = services.find((s) => s.name === name);
  return found ? found.duration_hours : null;
}
