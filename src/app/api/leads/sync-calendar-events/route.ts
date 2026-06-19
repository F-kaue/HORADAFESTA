import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadGoogleCalendarDetails } from "@/lib/google-calendar-lead";
import type { Lead } from "@/types/database";

/** Cria ou atualiza eventos no Google Calendar para leads confirmados/finalizados */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .in("status", ["confirmado", "finalizado"])
    .not("event_date", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    id: string;
    name: string;
    ok: boolean;
    created: boolean;
    error?: string;
  }> = [];

  for (const lead of (leads ?? []) as Lead[]) {
    const calendarResult = await syncLeadGoogleCalendarDetails(
      supabase,
      lead.id,
      user.id
    );

    results.push({
      id: lead.id,
      name: lead.name,
      ok: calendarResult.synced,
      created: calendarResult.created,
      error: calendarResult.error,
    });
  }

  const updated = results.filter((r) => r.ok && !r.created).length;
  const created = results.filter((r) => r.ok && r.created).length;
  const failed = results.filter((r) => !r.ok && r.error).length;

  return NextResponse.json({
    created,
    updated,
    failed,
    total: results.length,
    results,
    message:
      updated + created > 0
        ? `${created} criado(s), ${updated} atualizado(s) no Google Calendar.`
        : failed > 0
          ? "Nenhum evento sincronizado. Verifique a conexão com o Google Calendar."
          : "Não há leads confirmados para sincronizar.",
  });
}
