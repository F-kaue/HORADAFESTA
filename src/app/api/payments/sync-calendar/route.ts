import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadGoogleCalendarPayment } from "@/lib/google-calendar-payment";
import { fetchAllPaymentSummaries } from "@/lib/payment-server";

/** Sincroniza status de pagamento no Google Calendar para leads confirmados com evento */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const summaries = await fetchAllPaymentSummaries(supabase);

  const { data: leads } = await supabase
    .from("leads")
    .select("id")
    .eq("status", "confirmado")
    .not("google_event_id", "is", null);

  let synced = 0;
  let failed = 0;

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const lead of leads ?? []) {
    const summary = summaries[lead.id];
    if (!summary || summary.status === "none") continue;

    try {
      await syncLeadGoogleCalendarPayment(supabase, lead.id);
      synced++;
    } catch {
      failed++;
    }
    // Pequeno intervalo entre atualizações para respeitar o limite
    // de requisições por minuto do Google Calendar.
    await wait(200);
  }

  return NextResponse.json({ synced, failed });
}
