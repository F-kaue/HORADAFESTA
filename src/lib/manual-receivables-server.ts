import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function syncManualReceivableTotal(
  supabase: Supabase,
  manualReceivableId: string
) {
  const { data: txs } = await supabase
    .from("manual_receivable_transactions")
    .select("amount")
    .eq("manual_receivable_id", manualReceivableId);

  const total = (txs ?? []).reduce((s, t) => s + Number(t.amount), 0);
  await supabase
    .from("manual_receivables")
    .update({ received_total: total, updated_at: new Date().toISOString() })
    .eq("id", manualReceivableId);
  return total;
}
