import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  description: z.string().min(2).optional(),
  supplier: z.string().optional(),
  category: z.string().optional(),
  amount: z.number().positive().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paid_date: z.string().nullable().optional(),
  status: z.enum(["pendente", "pago", "cancelado"]).optional(),
  holder: z.string().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const updates = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.status === "pago" && !parsed.data.paid_date) {
    (updates as { paid_date?: string }).paid_date =
      new Date().toISOString().slice(0, 10);
  }
  if (parsed.data.status === "pendente") {
    (updates as { paid_date?: null }).paid_date = null;
  }

  const { data, error } = await supabase
    .from("accounts_payable")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, amount: Number(data.amount) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { error } = await supabase.from("accounts_payable").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
