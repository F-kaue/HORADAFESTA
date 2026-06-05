import {
  buildPaymentRecords,
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

export type CreatePaymentPlanInput = {
  leadId: string;
  userId: string;
  totalValue: number;
  downPayment: number;
  installments: number;
  paymentType: "avista" | "parcelado";
  downPaymentPaid: boolean;
  downPaymentPaidDate?: string;
  firstInstallmentDueDate?: string;
};

export async function createPaymentPlanForLead(
  supabase: SupabaseClient,
  input: CreatePaymentPlanInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await fetchPaymentBundle(supabase, input.leadId);
  if (existing) return { ok: true };

  const entrada = roundMoney(input.downPayment);
  if (entrada > input.totalValue) {
    return { ok: false, error: "A entrada não pode ser maior que o valor total" };
  }

  const remaining = roundMoney(input.totalValue - entrada);
  const parcelCount = input.paymentType === "avista" ? 1 : input.installments;
  const installmentValue =
    remaining > 0 ? roundMoney(remaining / parcelCount) : 0;

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: input.userId,
      lead_id: input.leadId,
      total_value: input.totalValue,
      down_payment: entrada,
      installments: parcelCount,
      installment_value: installmentValue,
      payment_type: input.paymentType,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: error.message };
  }

  const recordDrafts = buildPaymentRecords({
    paymentId: payment.id,
    totalValue: input.totalValue,
    downPayment: entrada,
    installments: input.installments,
    paymentType: input.paymentType,
    downPaymentPaid: false,
    downPaymentPaidDate: input.downPaymentPaidDate,
    firstInstallmentDueDate: input.firstInstallmentDueDate,
  });

  const { data: insertedRecords, error: recordsError } = await supabase
    .from("payment_records")
    .insert(recordDrafts)
    .select();

  if (recordsError) {
    await supabase.from("payments").delete().eq("id", payment.id);
    return { ok: false, error: recordsError.message };
  }

  if (input.downPaymentPaid && entrada > 0) {
    const entradaRecord = insertedRecords?.find((r) => r.record_kind === "entrada");
    if (entradaRecord) {
      const paidDate =
        input.downPaymentPaidDate || new Date().toISOString().slice(0, 10);
      await supabase.from("payment_transactions").insert({
        payment_id: payment.id,
        amount: entrada,
        paid_date: paidDate,
        notes: "Entrada",
        allocations: [{ record_id: entradaRecord.id, amount: entrada }],
      });
      await supabase
        .from("payment_records")
        .update({ is_paid: true, paid_date: paidDate })
        .eq("id", entradaRecord.id);
    }
  }

  return { ok: true };
}
