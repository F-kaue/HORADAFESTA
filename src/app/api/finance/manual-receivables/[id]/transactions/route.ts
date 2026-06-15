import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { syncManualReceivableTotal } from "@/lib/manual-receivables-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.number().positive(),
  paid_date: z.string(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { data: receivable } = await supabase
    .from("manual_receivables")
    .select("contract_total, received_total")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (!receivable) {
    return NextResponse.json({ error: "Recebível não encontrado" }, { status: 404 });
  }

  const contractTotal = Number(receivable.contract_total);
  const currentReceived = Number(receivable.received_total);
  const remaining = contractTotal - currentReceived;

  if (parsed.data.amount > remaining + 0.01) {
    return NextResponse.json(
      { error: `O máximo em aberto é R$ ${remaining.toFixed(2).replace(".", ",")}` },
      { status: 400 }
    );
  }

  const { data: tx, error } = await supabase
    .from("manual_receivable_transactions")
    .insert({
      manual_receivable_id: id,
      amount: parsed.data.amount,
      paid_date: parsed.data.paid_date,
      notes: parsed.data.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const newReceived = await syncManualReceivableTotal(supabase, id);

  return NextResponse.json({
    transaction: tx,
    summary: {
      total: contractTotal,
      received: newReceived,
      remaining: Math.max(0, contractTotal - newReceived),
    },
  });
}
