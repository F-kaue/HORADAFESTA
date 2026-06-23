import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  description: z.string().min(2),
  supplier: z.string().optional(),
  category: z.string().default("Outro"),
  amount: z.number().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paid_date: z.string().optional(),
  status: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
  holder: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  let q = supabase.from("accounts_payable").select("*").order("due_date");

  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const holder = searchParams.get("holder");
  const paymentMethod = searchParams.get("payment_method");

  if (status) q = q.eq("status", status);
  if (from) q = q.gte("due_date", from);
  if (to) q = q.lte("due_date", to);
  if (category) q = q.eq("category", category);
  if (holder) q = q.eq("holder", holder);
  if (paymentMethod) q = q.eq("payment_method", paymentMethod);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: holderRows } = await supabase
    .from("accounts_payable")
    .select("holder")
    .not("holder", "is", null);

  const holders = Array.from(
    new Set(
      (holderRows ?? [])
        .map((r) => r.holder as string)
        .filter((h) => h.trim().length > 0)
    )
  ).sort();

  return NextResponse.json({
    items: (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })),
    holders,
  });
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

  const payload = {
    ...parsed.data,
    user_id: user.id,
    paid_date:
      parsed.data.status === "pago"
        ? parsed.data.paid_date ?? new Date().toISOString().slice(0, 10)
        : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("accounts_payable")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, amount: Number(data.amount) }, { status: 201 });
}
