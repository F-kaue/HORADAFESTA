import {
  getPaidPerRecord,
  getTotalReceived,
  roundMoney,
  type PaymentRecordRow,
  type PaymentTransactionRow,
} from "@/lib/payments";
import type { Payment, PaymentRecordWithProgress, PaymentTransaction } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentBundleResponse = {
  payment: Payment;
  records: PaymentRecordWithProgress[];
  transactions: PaymentTransaction[];
  summary: { total: number; received: number; remaining: number };
};

/** Plano mais recente do lead (corrige falha do maybeSingle com duplicatas) */
export async function fetchPaymentBundle(
  supabase: SupabaseClient,
  leadId: string
): Promise<PaymentBundleResponse | null> {
  const { data: paymentRows, error: payErr } = await supabase
    .from("payments")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (payErr) return null;
  const payment = paymentRows?.[0] as Payment | undefined;
  if (!payment) return null;

  const { data: recordRows } = await supabase
    .from("payment_records")
    .select("*")
    .eq("payment_id", payment.id)
    .order("installment_number");

  let { data: txRows } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("payment_id", payment.id)
    .order("paid_date", { ascending: false });

  const recsRaw = (recordRows ?? []) as PaymentRecordRow[];

  if (!(txRows?.length) && recsRaw.some((r) => r.is_paid)) {
    for (const r of recsRaw.filter((x) => x.is_paid)) {
      await supabase.from("payment_transactions").insert({
        payment_id: payment.id,
        amount: r.value,
        paid_date: r.paid_date || new Date().toISOString().slice(0, 10),
        notes: "Importado do registro anterior",
        allocations: [{ record_id: r.id, amount: Number(r.value) }],
      });
    }
    const { data: refreshed } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_id", payment.id)
      .order("paid_date", { ascending: false });
    txRows = refreshed;
  }

  const txs = (txRows ?? []) as PaymentTransactionRow[];
  const paidPerRecord = getPaidPerRecord(txs);
  const total = Number(payment.total_value);
  const received = getTotalReceived(txs);

  const recordsWithProgress: PaymentRecordWithProgress[] = recsRaw.map((r) => {
    const paid = paidPerRecord[r.id] ?? 0;
    const value = Number(r.value);
    return {
      ...(r as PaymentRecordWithProgress),
      paid_amount: paid,
      remaining_amount: roundMoney(Math.max(0, value - paid)),
    };
  });

  return {
    payment,
    records: recordsWithProgress,
    transactions: txs as PaymentTransaction[],
    summary: {
      total,
      received,
      remaining: roundMoney(total - received),
    },
  };
}
