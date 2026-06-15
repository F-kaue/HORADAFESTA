import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyReceivableRow } from "@/lib/receivables";

export const dynamic = "force-dynamic";

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
