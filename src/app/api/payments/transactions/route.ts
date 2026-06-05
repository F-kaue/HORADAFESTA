import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  allocatePayment,
  buildRecordSyncUpdates,
  getPaidPerRecord,
  getTotalReceived,
  roundMoney,
  type PaymentRecordRow,
  type PaymentTransactionRow,
} from "@/lib/payments";
import { z } from "zod";

const createSchema = z.object({
  payment_id: z.string().uuid(),
  amount: z.number().positive(),
  paid_date: z.string(),
  notes: z.string().optional(),
  record_id: z.string().uuid().optional().nullable(),
});

async function syncRecords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paymentId: string
) {
  const { data: records } = await supabase
    .from("payment_records")
    .select("*")
    .eq("payment_id", paymentId)
    .order("installment_number");

  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("payment_id", paymentId)
    .order("paid_date", { ascending: false });

  if (!records?.length) return;

  const txs = (transactions ?? []) as PaymentTransactionRow[];
  const updates = buildRecordSyncUpdates(records as PaymentRecordRow[], txs);

  for (const u of updates) {
    await supabase
      .from("payment_records")
      .update({ is_paid: u.is_paid, paid_date: u.paid_date })
      .eq("id", u.id);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { payment_id, amount, paid_date, notes, record_id } = parsed.data;

  const { data: payment } = await supabase
    .from("payments")
    .select("*, leads(id)")
    .eq("id", payment_id)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  const { data: records } = await supabase
    .from("payment_records")
    .select("*")
    .eq("payment_id", payment_id)
    .order("installment_number");

  const { data: existingTx } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("payment_id", payment_id);

  const txs = (existingTx ?? []) as PaymentTransactionRow[];
  const received = getTotalReceived(txs);
  const total = Number(payment.total_value);

  if (roundMoney(received + amount) > total + 0.01) {
    return NextResponse.json(
      {
        error: `Valor excede o contrato. Falta receber: ${roundMoney(total - received).toFixed(2)}`,
      },
      { status: 400 }
    );
  }

  const paidPerRecord = getPaidPerRecord(txs);
  const allocations = allocatePayment(
    records as PaymentRecordRow[],
    paidPerRecord,
    amount,
    record_id
  );

  if (!allocations.length) {
    return NextResponse.json({ error: "Nada a abater no plano" }, { status: 400 });
  }

  const { data: transaction, error } = await supabase
    .from("payment_transactions")
    .insert({
      payment_id,
      amount,
      paid_date,
      notes: notes ?? null,
      allocations,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncRecords(supabase, payment_id);

  const newReceived = roundMoney(received + amount);
  return NextResponse.json({
    transaction,
    summary: {
      total,
      received: newReceived,
      remaining: roundMoney(total - newReceived),
    },
  });
}
