import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadGoogleCalendarPayment } from "@/lib/google-calendar-payment";
import {
  createPaymentPlanForLead,
  fetchPaymentBundle,
  updatePaymentContractTotal,
} from "@/lib/payment-server";
import { roundMoney } from "@/lib/payments";
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

  const result = await createPaymentPlanForLead(supabase, {
    leadId: lead_id,
    userId: user.id,
    totalValue: total_value,
    downPayment: entrada,
    installments,
    paymentType: payment_type,
    downPaymentPaid: down_payment_paid,
    downPaymentPaidDate: down_payment_paid_date,
    firstInstallmentDueDate: first_installment_due_date,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await supabase.from("leads").update({ total_value }).eq("id", lead_id);

  try {
    await syncLeadGoogleCalendarPayment(supabase, lead_id);
  } catch {
    // Google sync opcional
  }

  const bundle = await fetchPaymentBundle(supabase, lead_id);
  return NextResponse.json(bundle ?? { payment: null });
}

const patchByLeadSchema = z.object({
  lead_id: z.string().uuid(),
  total_value: z.number().positive(),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = patchByLeadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { data: paymentRows } = await supabase
    .from("payments")
    .select("id")
    .eq("lead_id", parsed.data.lead_id)
    .order("created_at", { ascending: false })
    .limit(1);

  const paymentId = paymentRows?.[0]?.id;
  if (!paymentId) {
    return NextResponse.json(
      { error: "Este cliente ainda não tem plano de pagamento" },
      { status: 404 }
    );
  }

  const result = await updatePaymentContractTotal(
    supabase,
    paymentId,
    parsed.data.total_value
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    await syncLeadGoogleCalendarPayment(supabase, parsed.data.lead_id);
  } catch {
    // sync opcional
  }

  return NextResponse.json(result.bundle);
}
