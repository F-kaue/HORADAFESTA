import {
  buildPaymentRecords,
  getPaidPerRecord,
  getTotalReceived,
  roundMoney,
  splitAmount,
  buildRecordSyncUpdates,
  type PaymentRecordRow,
  type PaymentTransactionRow,
} from "@/lib/payments";
import {
  buildPaymentSummary,
  type LeadPaymentSummary,
} from "@/lib/payment-status";
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
    downPaymentPaid: input.downPaymentPaid,
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

export async function updatePaymentContractTotal(
  supabase: SupabaseClient,
  paymentId: string,
  newTotalValue: number
): Promise<
  { ok: true; bundle: PaymentBundleResponse } | { ok: false; error: string }
> {
  const total = roundMoney(newTotalValue);
  if (total <= 0) {
    return { ok: false, error: "Informe um valor maior que zero" };
  }

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (payErr || !payment) {
    return { ok: false, error: "Plano de pagamento não encontrado" };
  }

  const { data: recordRows } = await supabase
    .from("payment_records")
    .select("*")
    .eq("payment_id", paymentId)
    .order("installment_number");

  const { data: txRows } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("payment_id", paymentId);

  const records = (recordRows ?? []) as PaymentRecordRow[];
  const txs = (txRows ?? []) as PaymentTransactionRow[];
  const received = getTotalReceived(txs);

  if (total < received - 0.009) {
    return {
      ok: false,
      error: `O contrato não pode ser menor que ${received.toFixed(2)} já recebido`,
    };
  }

  const newRemaining = roundMoney(total - received);
  const paidPerRecord = getPaidPerRecord(txs);

  const openRecords = records.filter((r) => {
    const paid = paidPerRecord[r.id] ?? 0;
    return roundMoney(Number(r.value) - paid) > 0.009;
  });

  if (openRecords.length === 0 && newRemaining > 0.009) {
    const maxNum = Math.max(0, ...records.map((r) => r.installment_number));
    const lastDue =
      records.filter((r) => r.due_date).at(-1)?.due_date ??
      new Date().toISOString().slice(0, 10);
    const { error: insertErr } = await supabase.from("payment_records").insert({
      payment_id: paymentId,
      installment_number: maxNum + 1,
      record_kind: "parcela",
      due_date: lastDue,
      paid_date: null,
      value: newRemaining,
      is_paid: false,
    });
    if (insertErr) return { ok: false, error: insertErr.message };
  } else if (openRecords.length > 0) {
    const splits = splitAmount(newRemaining, openRecords.length);
    for (let i = 0; i < openRecords.length; i++) {
      const record = openRecords[i];
      const paid = paidPerRecord[record.id] ?? 0;
      const newValue = roundMoney(paid + splits[i]);
      const { error: updErr } = await supabase
        .from("payment_records")
        .update({
          value: newValue,
          is_paid: newValue - paid <= 0.009,
          paid_date: newValue - paid <= 0.009 ? record.paid_date : null,
        })
        .eq("id", record.id);
      if (updErr) return { ok: false, error: updErr.message };
    }
  }

  const downPayment = Number(payment.down_payment ?? 0);
  const balance = roundMoney(Math.max(0, total - downPayment));
  const installments = Math.max(1, Number(payment.installments) || 1);

  const { error: paymentErr } = await supabase
    .from("payments")
    .update({
      total_value: total,
      installment_value: balance > 0 ? roundMoney(balance / installments) : 0,
    })
    .eq("id", paymentId);

  if (paymentErr) return { ok: false, error: paymentErr.message };

  await supabase.from("leads").update({ total_value: total }).eq("id", payment.lead_id);

  const { data: freshRecords } = await supabase
    .from("payment_records")
    .select("*")
    .eq("payment_id", paymentId);

  const syncUpdates = buildRecordSyncUpdates(
    (freshRecords ?? []) as PaymentRecordRow[],
    txs
  );
  for (const update of syncUpdates) {
    await supabase
      .from("payment_records")
      .update({ is_paid: update.is_paid, paid_date: update.paid_date })
      .eq("id", update.id);
  }

  const bundle = await fetchPaymentBundle(supabase, payment.lead_id);
  if (!bundle) return { ok: false, error: "Erro ao recarregar pagamentos" };

  return { ok: true, bundle };
}

/** Resumo financeiro por lead (plano mais recente) — para kanban e filtros */
export async function fetchAllPaymentSummaries(
  supabase: SupabaseClient
): Promise<Record<string, LeadPaymentSummary>> {
  const { data: paymentRows } = await supabase
    .from("payments")
    .select("id, lead_id, total_value, created_at")
    .order("created_at", { ascending: false });

  const latestByLead = new Map<string, { id: string; total_value: number }>();
  for (const row of paymentRows ?? []) {
    if (!latestByLead.has(row.lead_id)) {
      latestByLead.set(row.lead_id, {
        id: row.id,
        total_value: Number(row.total_value),
      });
    }
  }

  if (latestByLead.size === 0) return {};

  const paymentIds = Array.from(latestByLead.values()).map((p) => p.id);
  const { data: txRows } = await supabase
    .from("payment_transactions")
    .select("payment_id, amount")
    .in("payment_id", paymentIds);

  const receivedByPayment = new Map<string, number>();
  for (const tx of txRows ?? []) {
    const prev = receivedByPayment.get(tx.payment_id) ?? 0;
    receivedByPayment.set(tx.payment_id, prev + Number(tx.amount));
  }

  const result: Record<string, LeadPaymentSummary> = {};
  for (const [leadId, payment] of Array.from(latestByLead.entries())) {
    const received = receivedByPayment.get(payment.id) ?? 0;
    result[leadId] = buildPaymentSummary(payment.total_value, received);
  }

  return result;
}
