import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildPaymentRecords,
  getPaidPerRecord,
  getTotalReceived,
  roundMoney,
  type PaymentRecordRow,
  type PaymentTransactionRow,
} from "@/lib/payments";
import { z } from "zod";

const createSchema = z.object({
  lead_id: z.string().uuid(),
  total_value: z.number().positive(),
  down_payment: z.number().min(0).default(0),
  installments: z.number().int().min(1).max(24).default(1),
  payment_type: z.enum(["avista", "parcelado"]),
  down_payment_paid: z.boolean().default(false),
  down_payment_paid_date: z.string().optional(),
  down_payment_due_date: z.string().optional(),
  first_installment_due_date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "lead_id obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (!payment) return NextResponse.json({ payment: null, records: [], transactions: [] });

  const { data: records } = await supabase
    .from("payment_records")
    .select("*")
    .eq("payment_id", payment.id)
    .order("installment_number");

  let { data: transactions } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("payment_id", payment.id)
    .order("paid_date", { ascending: false });

  const recsRaw = records ?? [];

  if (!transactions?.length && recsRaw.some((r) => r.is_paid)) {
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
    transactions = refreshed;
  }

  const txs = (transactions ?? []) as PaymentTransactionRow[];
  const recs = (records ?? []) as PaymentRecordRow[];
  const paidPerRecord = getPaidPerRecord(txs);
  const total = Number(payment.total_value);
  const received = getTotalReceived(txs);

  const recordsWithProgress = recs.map((r) => {
    const paid = paidPerRecord[r.id] ?? 0;
    const value = Number(r.value);
    return {
      ...r,
      paid_amount: paid,
      remaining_amount: roundMoney(Math.max(0, value - paid)),
    };
  });

  return NextResponse.json({
    payment,
    records: recordsWithProgress,
    transactions: txs,
    summary: {
      total,
      received,
      remaining: roundMoney(total - received),
    },
  });
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

  const {
    lead_id,
    total_value,
    down_payment,
    installments,
    payment_type,
    down_payment_paid,
    down_payment_paid_date,
    down_payment_due_date,
    first_installment_due_date,
  } = parsed.data;

  const entrada = roundMoney(down_payment);
  if (entrada > total_value) {
    return NextResponse.json(
      { error: "A entrada não pode ser maior que o valor total" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("lead_id", lead_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Este lead já possui um plano de pagamento" },
      { status: 400 }
    );
  }

  const remaining = roundMoney(total_value - entrada);
  const parcelCount = payment_type === "avista" ? 1 : installments;
  const installmentValue =
    remaining > 0 ? roundMoney(remaining / parcelCount) : 0;

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      lead_id,
      total_value,
      down_payment: entrada,
      installments: parcelCount,
      installment_value: installmentValue,
      payment_type,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recordDrafts = buildPaymentRecords({
    paymentId: payment.id,
    totalValue: total_value,
    downPayment: entrada,
    installments,
    paymentType: payment_type,
    downPaymentPaid: false,
    downPaymentPaidDate: down_payment_paid_date,
    downPaymentDueDate: down_payment_due_date,
    firstInstallmentDueDate: first_installment_due_date,
  });

  const { data: insertedRecords, error: recordsError } = await supabase
    .from("payment_records")
    .insert(recordDrafts)
    .select();

  if (recordsError) {
    await supabase.from("payments").delete().eq("id", payment.id);
    return NextResponse.json({ error: recordsError.message }, { status: 500 });
  }

  if (down_payment_paid && entrada > 0) {
    const entradaRecord = insertedRecords?.find((r) => r.record_kind === "entrada");
    if (entradaRecord) {
      await supabase.from("payment_transactions").insert({
        payment_id: payment.id,
        amount: entrada,
        paid_date: down_payment_paid_date || new Date().toISOString().slice(0, 10),
        notes: "Entrada",
        allocations: [{ record_id: entradaRecord.id, amount: entrada }],
      });
      await supabase
        .from("payment_records")
        .update({
          is_paid: true,
          paid_date: down_payment_paid_date || new Date().toISOString().slice(0, 10),
        })
        .eq("id", entradaRecord.id);
    }
  }

  await supabase.from("leads").update({ total_value }).eq("id", lead_id);

  return NextResponse.json({ payment, records: insertedRecords });
}
