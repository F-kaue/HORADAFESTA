import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (!payment) return NextResponse.json({ payment: null, records: [] });

  const { data: records } = await supabase
    .from("payment_records")
    .select("*")
    .eq("payment_id", payment.id)
    .order("installment_number");

  return NextResponse.json({ payment, records });
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

  const records = buildPaymentRecords({
    paymentId: payment.id,
    totalValue: total_value,
    downPayment: entrada,
    installments,
    paymentType: payment_type,
    downPaymentPaid: down_payment_paid,
    downPaymentPaidDate: down_payment_paid_date,
    downPaymentDueDate: down_payment_due_date,
    firstInstallmentDueDate: first_installment_due_date,
  });

  const { error: recordsError } = await supabase
    .from("payment_records")
    .insert(records);

  if (recordsError) {
    await supabase.from("payments").delete().eq("id", payment.id);
    return NextResponse.json({ error: recordsError.message }, { status: 500 });
  }

  await supabase
    .from("leads")
    .update({ total_value })
    .eq("id", lead_id);

  return NextResponse.json({ payment, records });
}
