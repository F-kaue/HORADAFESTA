import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { lead_id, total_value, installments, payment_type } = await request.json();
  const count = Math.max(1, parseInt(installments, 10) || 1);
  const installmentValue = total_value / count;

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      lead_id,
      total_value,
      installments: count,
      installment_value: installmentValue,
      payment_type: payment_type ?? (count > 1 ? "parcelado" : "avista"),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const records = Array.from({ length: count }, (_, i) => {
    const due = new Date();
    due.setMonth(due.getMonth() + i);
    return {
      payment_id: payment.id,
      installment_number: i + 1,
      due_date: due.toISOString().slice(0, 10),
      value: installmentValue,
      is_paid: false,
    };
  });

  await supabase.from("payment_records").insert(records);

  return NextResponse.json({ payment });
}
