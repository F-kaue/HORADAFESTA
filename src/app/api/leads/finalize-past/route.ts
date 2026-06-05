import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayFortaleza(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Move leads confirmados com data passada para finalizado */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const today = todayFortaleza();
  const now = new Date().toISOString();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, name")
    .eq("status", "confirmado")
    .is("archived_at", null)
    .not("event_date", "is", null)
    .lt("event_date", today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!leads?.length) return NextResponse.json({ finalized: 0, names: [] });

  const ids = leads.map((l) => l.id);
  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: "finalizado", finalized_at: now })
    .in("id", ids);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    finalized: leads.length,
    names: leads.map((l) => l.name),
  });
}
