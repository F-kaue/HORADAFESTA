import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncManualReceivableTotal } from "@/lib/manual-receivables-server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  const { id, txId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: receivable } = await supabase
    .from("manual_receivables")
    .select("contract_total")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (!receivable) {
    return NextResponse.json({ error: "Recebível não encontrado" }, { status: 404 });
  }

  const { error } = await supabase
    .from("manual_receivable_transactions")
    .delete()
    .eq("id", txId)
    .eq("manual_receivable_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const newReceived = await syncManualReceivableTotal(supabase, id);
  const contractTotal = Number(receivable.contract_total);

  return NextResponse.json({
    ok: true,
    summary: {
      total: contractTotal,
      received: newReceived,
      remaining: Math.max(0, contractTotal - newReceived),
    },
  });
}
