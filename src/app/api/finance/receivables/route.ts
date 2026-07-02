import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDateInRange } from "@/lib/finance-period";
import { getTotalReceived } from "@/lib/payments";
import {
  buildReceivablesSummary,
  classifyReceivableRow,
  computeReceivedInEventPeriod,
  isEventInFinancePeriod,
  type ReceivableBucket,
} from "@/lib/receivables";
import type { PaymentTransactionRow } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bucket = searchParams.get("bucket") as ReceivableBucket | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const eventType = searchParams.get("event_type");
  const status = searchParams.get("status");
  const periodRange =
    from && to ? ({ from, to } satisfies { from: string; to: string }) : null;

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, event_date, event_type, status, total_value, revenue_recognized_at")
    .in("status", ["confirmado", "finalizado"])
    .order("event_date", { ascending: true });

  const leadIds = (leads ?? []).map((l) => l.id);

  const { data: payments } = leadIds.length
    ? await supabase
        .from("payments")
        .select("id, lead_id, total_value")
        .in("lead_id", leadIds)
    : { data: [] };

  const paymentIds = (payments ?? []).map((p) => p.id);
  const paymentByLead = new Map(
    (payments ?? []).map((p) => [p.lead_id as string, p])
  );

  let txs: PaymentTransactionRow[] = [];
  if (paymentIds.length > 0) {
    const { data: txRows } = await supabase
      .from("payment_transactions")
      .select("*")
      .in("payment_id", paymentIds);
    txs = (txRows ?? []) as PaymentTransactionRow[];
  }

  const receivedByPayment = new Map<string, number>();
  for (const p of payments ?? []) {
    const pTxs = txs.filter((t) => t.payment_id === p.id);
    receivedByPayment.set(p.id, getTotalReceived(pTxs));
  }

  const { data: payablesRaw } = await supabase
    .from("accounts_payable")
    .select("lead_id, amount, paid_date, status")
    .neq("status", "cancelado");

  const expensesByLead = new Map<string, number>();
  const totalPaidPayables = (payablesRaw ?? [])
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + Number(p.amount), 0);

  const leadEventDate = new Map(
    (leads ?? []).map((l) => [l.id as string, l.event_date as string | null])
  );

  if (periodRange) {
    for (const p of payablesRaw ?? []) {
      if (p.status !== "pago" || !p.paid_date || !p.lead_id) continue;
      if (!isDateInRange(p.paid_date as string, periodRange)) continue;
      if (!isEventInFinancePeriod(leadEventDate.get(p.lead_id as string), periodRange)) {
        continue;
      }
      expensesByLead.set(
        p.lead_id as string,
        (expensesByLead.get(p.lead_id as string) ?? 0) + Number(p.amount)
      );
    }
  }

  const leadRows = (leads ?? []).map((lead) => {
    const payment = paymentByLead.get(lead.id);
    const contractTotal = payment
      ? Number(payment.total_value)
      : Number(lead.total_value ?? 0);
    const received = payment
      ? receivedByPayment.get(payment.id) ?? 0
      : 0;

    const receivedInPeriod = computeReceivedInEventPeriod(
      received,
      lead.event_date,
      periodRange
    );

    const expensesInPeriod = expensesByLead.get(lead.id) ?? 0;

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
      expensesInPeriod,
      profitInPeriod: receivedInPeriod - expensesInPeriod,
    };
  });

  const { data: manualRows } = await supabase
    .from("manual_receivables")
    .select("*")
    .eq("active", true)
    .order("event_date", { ascending: true });

  const manualReceivableRows = (manualRows ?? []).map((m) => {
    const receivedInPeriod = computeReceivedInEventPeriod(
      Number(m.received_total),
      m.event_date as string | null,
      periodRange
    );

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
      expensesInPeriod: 0,
      profitInPeriod: receivedInPeriod,
    };
  });

  const allRows = [...leadRows, ...manualReceivableRows];
  const eventTypes = Array.from(
    new Set(allRows.map((r) => r.eventType).filter(Boolean))
  ).sort() as string[];

  let rows = allRows;

  if (periodRange) {
    rows = rows.filter((r) => isEventInFinancePeriod(r.eventDate, periodRange));
  }
  if (eventType) rows = rows.filter((r) => r.eventType === eventType);
  if (status) rows = rows.filter((r) => r.status === status);
  if (bucket) rows = rows.filter((r) => r.bucket === bucket);

  rows.sort((a, b) => {
    const da = a.eventDate ?? "9999-99-99";
    const db = b.eventDate ?? "9999-99-99";
    return da.localeCompare(db);
  });

  const summary = buildReceivablesSummary(rows);
  const globalSummary = buildReceivablesSummary(allRows);
  const receivedInPeriodTotal = rows.reduce(
    (s, r) => s + (r.receivedInPeriod ?? 0),
    0
  );
  const expensesInPeriodTotal = rows.reduce(
    (s, r) => s + (r.expensesInPeriod ?? 0),
    0
  );

  return NextResponse.json({
    ...summary,
    eventTypes,
    receivedInPeriodTotal,
    expensesInPeriodTotal,
    profitInPeriodTotal: receivedInPeriodTotal - expensesInPeriodTotal,
    netAvailableBalance: globalSummary.availableTotal - totalPaidPayables,
    paidPayablesTotal: totalPaidPayables,
  });
}
