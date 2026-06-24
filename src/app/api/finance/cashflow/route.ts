import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildClientProfitRows } from "@/lib/client-profit";
import {
  buildPeriodChartBuckets,
  getDefaultPeriodRange,
  isDateInRange,
  type FinancePeriodRange,
} from "@/lib/finance-period";
import { summarizePayables } from "@/lib/payables";
import { buildReceivablesSummary, classifyReceivableRow } from "@/lib/receivables";
import { getTotalReceived } from "@/lib/payments";
import type { PaymentTransactionRow } from "@/lib/payments";

export const dynamic = "force-dynamic";

function resolveRange(searchParams: URLSearchParams): FinancePeriodRange {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from && to) return { from, to };
  return getDefaultPeriodRange("week");
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = resolveRange(searchParams);
  const mode = searchParams.get("mode") === "month" ? "month" : "week";

  const { data: payablesRaw } = await supabase
    .from("accounts_payable")
    .select("*, leads(name)")
    .neq("status", "cancelado")
    .order("due_date");

  const payables = (payablesRaw ?? []).map((p) => ({
    ...p,
    amount: Number(p.amount),
    client_name: (p.leads as { name?: string } | null)?.name ?? null,
  }));

  const payablesSummary = summarizePayables(payables as never[]);

  const totalPaidPayables = payables
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + Number(p.amount), 0);

  const periodPaidOut = payables
    .filter(
      (p) =>
        p.status === "pago" &&
        p.paid_date &&
        isDateInRange(p.paid_date as string, range)
    )
    .reduce((s, p) => s + Number(p.amount), 0);

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, event_date, event_type, status, total_value, revenue_recognized_at")
    .in("status", ["confirmado", "finalizado"]);

  const leadIds = (leads ?? []).map((l) => l.id);
  const leadNameById = new Map((leads ?? []).map((l) => [l.id, l.name as string]));

  const { data: payments } = await supabase
    .from("payments")
    .select("id, lead_id, total_value")
    .in("lead_id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]);

  const paymentIds = (payments ?? []).map((p) => p.id);
  let txs: PaymentTransactionRow[] = [];
  if (paymentIds.length) {
    const { data: txRows } = await supabase
      .from("payment_transactions")
      .select("*")
      .in("payment_id", paymentIds);
    txs = (txRows ?? []) as PaymentTransactionRow[];
  }

  const paymentByLead = new Map((payments ?? []).map((p) => [p.lead_id, p]));
  const leadReceivableRows = (leads ?? []).map((lead) => {
    const payment = paymentByLead.get(lead.id);
    const contractTotal = payment
      ? Number(payment.total_value)
      : Number(lead.total_value ?? 0);
    const paymentTxs = payment
      ? txs.filter((t) => t.payment_id === payment.id)
      : [];
    const received = payment ? getTotalReceived(paymentTxs) : 0;
    const receivedInPeriod = paymentTxs
      .filter((t) => isDateInRange(t.paid_date, range))
      .reduce((s, t) => s + Number(t.amount), 0);

    return {
      ...classifyReceivableRow({
        leadId: lead.id,
        source: "lead",
        clientName: lead.name,
        eventDate: lead.event_date,
        eventType: lead.event_type,
        status: lead.status,
        contractTotal,
        received,
        revenueRecognizedAt: lead.revenue_recognized_at,
      }),
      receivedInPeriod,
    };
  });

  const { data: manualRows } = await supabase
    .from("manual_receivables")
    .select("*")
    .eq("active", true);

  const { data: manualTxRows } = await supabase
    .from("manual_receivable_transactions")
    .select("*");

  const manualReceivableRows = (manualRows ?? []).map((m) => {
    const mTxs = (manualTxRows ?? []).filter(
      (t) => t.manual_receivable_id === m.id
    );
    const receivedInPeriodFromTx = mTxs
      .filter((t) => isDateInRange(t.paid_date as string, range))
      .reduce((s, t) => s + Number(t.amount), 0);
    const receivedInPeriod =
      receivedInPeriodFromTx > 0
        ? receivedInPeriodFromTx
        : m.received_date && isDateInRange(m.received_date as string, range)
          ? Number(m.received_total)
          : 0;

    return {
      ...classifyReceivableRow({
        leadId: m.id,
        source: "manual",
        clientName: m.client_name,
        eventDate: m.event_date,
        eventType: m.event_type,
        status: "manual",
        contractTotal: Number(m.contract_total),
        received: Number(m.received_total),
        revenueRecognizedAt: m.revenue_recognized_at,
      }),
      receivedInPeriod,
    };
  });

  const receivableRows = [...leadReceivableRows, ...manualReceivableRows];
  const receivables = buildReceivablesSummary(receivableRows);

  const periodReceivedIn = receivableRows.reduce(
    (s, r) => s + (r.receivedInPeriod ?? 0),
    0
  );

  const netAvailableBalance = receivables.availableTotal - totalPaidPayables;

  const periodExpensesByLead = new Map<string, number>();
  for (const p of payables) {
    if (p.status !== "pago" || !p.paid_date || !isDateInRange(p.paid_date as string, range)) {
      continue;
    }
    if (!p.lead_id) continue;
    periodExpensesByLead.set(
      p.lead_id as string,
      (periodExpensesByLead.get(p.lead_id as string) ?? 0) + Number(p.amount)
    );
  }

  const clientProfit = buildClientProfitRows(
    receivableRows
      .filter((r) => (r.receivedInPeriod ?? 0) > 0)
      .map((r) => ({
        leadId: r.source === "lead" ? r.leadId : null,
        clientName: r.clientName,
        amount: r.receivedInPeriod ?? 0,
      })),
    payables
      .filter(
        (p) =>
          p.status === "pago" &&
          p.paid_date &&
          isDateInRange(p.paid_date as string, range) &&
          p.lead_id
      )
      .map((p) => ({
        leadId: p.lead_id as string,
        clientName: leadNameById.get(p.lead_id as string) ?? p.client_name,
        amount: Number(p.amount),
      }))
  );

  const chartBuckets = buildPeriodChartBuckets(range, mode);
  const periodFlow = chartBuckets.map((bucket) => {
    const inAmount =
      txs
        .filter((t) => isDateInRange(t.paid_date, bucket))
        .reduce((s, t) => s + Number(t.amount), 0) +
      (manualTxRows ?? [])
        .filter((t) => isDateInRange(t.paid_date as string, bucket))
        .reduce((s, t) => s + Number(t.amount), 0) +
      (manualRows ?? [])
        .filter(
          (m) =>
            m.received_date &&
            isDateInRange(m.received_date as string, bucket) &&
            !(manualTxRows ?? []).some((t) => t.manual_receivable_id === m.id)
        )
        .reduce((s, m) => s + Number(m.received_total), 0);

    const outAmount = payables
      .filter(
        (p) =>
          p.status === "pago" &&
          p.paid_date &&
          isDateInRange(p.paid_date as string, bucket)
      )
      .reduce((s, p) => s + Number(p.amount), 0);

    return {
      key: bucket.key,
      label: bucket.label,
      in: inAmount,
      out: outAmount,
      balance: inAmount - outAmount,
    };
  });

  return NextResponse.json({
    receivables,
    payables: payablesSummary,
    period: range,
    periodMode: mode,
    periodReceivedIn,
    periodPaidOut,
    periodBalance: periodReceivedIn - periodPaidOut,
    totalPaidPayables,
    netAvailableBalance,
    availableBalance: netAvailableBalance,
    clientProfit,
    periodFlow,
    // compatibilidade com cards antigos
    monthReceivedIn: periodReceivedIn,
    monthPaidOut: periodPaidOut,
    monthBalance: periodReceivedIn - periodPaidOut,
    monthlyFlow: periodFlow.map((b) => ({
      month: b.key,
      in: b.in,
      out: b.out,
      balance: b.balance,
    })),
  });
}
