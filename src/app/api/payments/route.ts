import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPaymentBundle } from "@/lib/payment-server";
import { buildPaymentRecords, roundMoney } from "@/lib/payments";
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
  const bundle = await fetchPaymentBundle(supabase, leadId);

  if (!bundle) {
    return NextResponse.json({ payment: null, records: [], transactions: [], summary: null });
  }

  return NextResponse.json(bundle);
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

  const existingBundle = await fetchPaymentBundle(supabase, lead_id);
  if (existingBundle) {
    return NextResponse.json({
      ...existingBundle,
      already_exists: true,
    });
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

  if (error) {
    if (error.code === "23505") {
      const bundle = await fetchPaymentBundle(supabase, lead_id);
      if (bundle) return NextResponse.json(bundle);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const bundle = await fetchPaymentBundle(supabase, lead_id);
  return NextResponse.json(bundle ?? { payment, records: insertedRecords });
}
