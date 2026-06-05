import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildRecordSyncUpdates,
  type PaymentRecordRow,
  type PaymentTransactionRow,
} from "@/lib/payments";

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

  const { data: tx } = await supabase
    .from("payment_transactions")
    .select("payment_id")
    .eq("id", id)
    .single();

  if (!tx) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { error } = await supabase.from("payment_transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: records } = await supabase
    .from("payment_records")
    .select("*")
    .eq("payment_id", tx.payment_id);

  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("payment_id", tx.payment_id);

  const updates = buildRecordSyncUpdates(
    (records ?? []) as PaymentRecordRow[],
    (transactions ?? []) as PaymentTransactionRow[]
  );

  for (const u of updates) {
    await supabase
      .from("payment_records")
      .update({ is_paid: u.is_paid, paid_date: u.paid_date })
      .eq("id", u.id);
  }

  return NextResponse.json({ ok: true });
}
