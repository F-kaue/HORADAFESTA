import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTotalReceived } from "@/lib/payments";
import {
  buildReceivablesSummary,
  classifyReceivableRow,
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

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, event_date, event_type, status, total_value")
    .in("status", ["confirmado", "finalizado"])
    .order("event_date", { ascending: true });

  const leadIds = (leads ?? []).map((l) => l.id);
  if (leadIds.length === 0) {
    return NextResponse.json(buildReceivablesSummary([]));
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("id, lead_id, total_value")
    .in("lead_id", leadIds);

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

  let rows = (leads ?? []).map((lead) => {
    const payment = paymentByLead.get(lead.id);
    const contractTotal = payment
      ? Number(payment.total_value)
      : Number(lead.total_value ?? 0);
    const received = payment
      ? receivedByPayment.get(payment.id) ?? 0
      : 0;

    return classifyReceivableRow({
      leadId: lead.id,
      clientName: lead.name,
      eventDate: lead.event_date,
      eventType: lead.event_type,
      status: lead.status,
      contractTotal,
      received,
    });
  });

  if (from) rows = rows.filter((r) => r.eventDate && r.eventDate >= from);
  if (to) rows = rows.filter((r) => r.eventDate && r.eventDate <= to);
  if (eventType) rows = rows.filter((r) => r.eventType === eventType);
  if (status) rows = rows.filter((r) => r.status === status);
  if (bucket) rows = rows.filter((r) => r.bucket === bucket);

  return NextResponse.json(buildReceivablesSummary(rows));
}
