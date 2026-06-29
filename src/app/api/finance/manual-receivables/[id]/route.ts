import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyReceivableRow } from "@/lib/receivables";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  contract_total: z.number().positive(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: row, error } = await supabase
    .from("manual_receivables")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Recebível não encontrado" }, { status: 404 });
  }

  const { data: transactions } = await supabase
    .from("manual_receivable_transactions")
    .select("*")
    .eq("manual_receivable_id", id)
    .order("paid_date", { ascending: false });

  const contractTotal = Number(row.contract_total);
  const received = Number(row.received_total);
  const summary = classifyReceivableRow({
    leadId: row.id,
    source: "manual",
    clientName: row.client_name,
    eventDate: row.event_date,
    eventType: row.event_type,
    status: "manual",
    contractTotal,
    received,
    revenueRecognizedAt: row.revenue_recognized_at,
  });

  return NextResponse.json({
    receivable: row,
    transactions: transactions ?? [],
    summary: {
      total: contractTotal,
      received,
      remaining: summary.pending,
      held: summary.held,
      available: summary.available,
      bucket: summary.bucket,
      manuallyReleased: summary.manuallyReleased,
    },
  });
}

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

  const { data: row, error: fetchErr } = await supabase
    .from("manual_receivables")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Recebível não encontrado" }, { status: 404 });
  }

  const received = Number(row.received_total);
  if (parsed.data.contract_total < received - 0.009) {
    return NextResponse.json(
      {
        error: `O contrato não pode ser menor que o valor já recebido (${received.toFixed(2)})`,
      },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from("manual_receivables")
    .update({
      contract_total: parsed.data.contract_total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const contractTotal = Number(updated.contract_total);
  const summary = classifyReceivableRow({
    leadId: updated.id,
    source: "manual",
    clientName: updated.client_name,
    eventDate: updated.event_date,
    eventType: updated.event_type,
    status: "manual",
    contractTotal,
    received,
    revenueRecognizedAt: updated.revenue_recognized_at,
  });

  return NextResponse.json({
    receivable: updated,
    summary: {
      total: contractTotal,
      received,
      remaining: summary.pending,
      held: summary.held,
      available: summary.available,
      bucket: summary.bucket,
      manuallyReleased: summary.manuallyReleased,
    },
  });
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

  const { error } = await supabase
    .from("manual_receivables")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
