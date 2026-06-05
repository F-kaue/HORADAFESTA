import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  is_paid: z.boolean().optional(),
  paid_date: z.string().nullable().optional(),
  value: z.number().positive().optional(),
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

  const updates: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.is_paid === true && !parsed.data.paid_date) {
    updates.paid_date = new Date().toISOString().slice(0, 10);
  }
  if (parsed.data.is_paid === false) {
    updates.paid_date = null;
  }

  const { data, error } = await supabase
    .from("payment_records")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
