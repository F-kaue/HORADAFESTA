import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  client_name: z.string().min(2),
  description: z.string().optional(),
  event_date: z.string().optional(),
  event_type: z.string().optional(),
  contract_total: z.number().positive(),
  received_total: z.number().min(0).default(0),
  received_date: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  mark_available: z.boolean().default(false),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("manual_receivables")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (parsed.data.received_total > parsed.data.contract_total) {
    return NextResponse.json(
      { error: "O valor recebido não pode ser maior que o contrato" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    client_name: parsed.data.client_name.trim(),
    description: parsed.data.description?.trim() || null,
    event_date: parsed.data.event_date || null,
    event_type: parsed.data.event_type || null,
    contract_total: parsed.data.contract_total,
    received_total: parsed.data.received_total,
    received_date: parsed.data.received_date || null,
    payment_method: parsed.data.payment_method || null,
    notes: parsed.data.notes || null,
    revenue_recognized_at:
      parsed.data.mark_available && parsed.data.received_total > 0 ? now : null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("manual_receivables")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.received_total > 0) {
    await supabase.from("manual_receivable_transactions").insert({
      manual_receivable_id: data.id,
      amount: parsed.data.received_total,
      paid_date: parsed.data.received_date || new Date().toISOString().slice(0, 10),
      notes: "Lançamento inicial",
    });
  }

  return NextResponse.json(data, { status: 201 });
}
