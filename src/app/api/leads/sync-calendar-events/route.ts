import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCalendarEventForLead } from "@/lib/google-calendar-lead";
import type { Lead } from "@/types/database";

/** Cria eventos no Google Calendar para leads confirmados sem google_event_id */
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
    .is("google_event_id", null)
    .not("event_date", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    id: string;
    name: string;
    ok: boolean;
    eventId?: string;
    error?: string;
  }> = [];

  for (const lead of (leads ?? []) as Lead[]) {
    const calendarResult = await createCalendarEventForLead(
      supabase,
      user.id,
      lead
    );

    if (calendarResult.eventId) {
      await supabase
        .from("leads")
        .update({ google_event_id: calendarResult.eventId })
        .eq("id", lead.id);

      results.push({
        id: lead.id,
        name: lead.name,
        ok: true,
        eventId: calendarResult.eventId,
      });
    } else {
      results.push({
        id: lead.id,
        name: lead.name,
        ok: false,
        error: calendarResult.error,
      });
    }
  }

  const created = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({
    created,
    failed,
    total: results.length,
    results,
    message:
      created > 0
        ? `${created} evento(s) criado(s) no Google Calendar.`
        : failed > 0
          ? "Nenhum evento foi criado. Verifique a conexão com o Google Calendar."
          : "Não há leads confirmados pendentes de sincronização.",
  });
}
