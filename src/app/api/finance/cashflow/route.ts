import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizePayables } from "@/lib/payables";
import { buildReceivablesSummary, classifyReceivableRow } from "@/lib/receivables";
import { getTotalReceived } from "@/lib/payments";
import type { PaymentTransactionRow } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  const { data: payables } = await supabase
    .from("accounts_payable")
    .select("*")
    .neq("status", "cancelado")
    .order("due_date");

  const payablesSummary = summarizePayables((payables ?? []) as never[]);

  const monthPaidOut = (payables ?? [])
    .filter((p) => p.status === "pago" && p.paid_date && p.paid_date >= monthStart)
    .reduce((s, p) => s + Number(p.amount), 0);

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, event_date, event_type, status, total_value, revenue_recognized_at")
    .in("status", ["confirmado", "finalizado"]);

  const leadIds = (leads ?? []).map((l) => l.id);
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
  const receivableRows = (leads ?? []).map((lead) => {
    const payment = paymentByLead.get(lead.id);
    const contractTotal = payment
      ? Number(payment.total_value)
      : Number(lead.total_value ?? 0);
    const received = payment
      ? getTotalReceived(txs.filter((t) => t.payment_id === payment.id))
      : 0;
    return classifyReceivableRow({
      leadId: lead.id,
      clientName: lead.name,
      eventDate: lead.event_date,
      eventType: lead.event_type,
      status: lead.status,
      contractTotal,
      received,
      revenueRecognizedAt: lead.revenue_recognized_at,
    });
  });

  const receivables = buildReceivablesSummary(receivableRows);

  const monthReceivedIn = txs
    .filter((t) => t.paid_date >= monthStart)
    .reduce((s, t) => s + Number(t.amount), 0);

  const monthlyFlow: { month: string; in: number; out: number; balance: number }[] = [];
  const flowMap = new Map<string, { in: number; out: number }>();

  txs.forEach((t) => {
    const m = t.paid_date.slice(0, 7);
    const cur = flowMap.get(m) ?? { in: 0, out: 0 };
    cur.in += Number(t.amount);
    flowMap.set(m, cur);
  });

  (payables ?? [])
    .filter((p) => p.status === "pago" && p.paid_date)
    .forEach((p) => {
      const m = (p.paid_date as string).slice(0, 7);
      const cur = flowMap.get(m) ?? { in: 0, out: 0 };
      cur.out += Number(p.amount);
      flowMap.set(m, cur);
    });

  Array.from(flowMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .forEach(([month, v]) => {
      monthlyFlow.push({
        month,
        in: v.in,
        out: v.out,
        balance: v.in - v.out,
      });
    });

  return NextResponse.json({
    receivables,
    payables: payablesSummary,
    monthReceivedIn,
    monthPaidOut,
    monthBalance: monthReceivedIn - monthPaidOut,
    availableBalance: receivables.availableTotal - payablesSummary.pendingTotal,
    monthlyFlow,
  });
}
