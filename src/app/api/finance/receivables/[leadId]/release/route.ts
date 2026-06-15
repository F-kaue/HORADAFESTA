import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Confirma que o saldo recebido já pode contar como receita disponível */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const source = new URL(request.url).searchParams.get("source");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const now = new Date().toISOString();

  if (source === "manual") {
    const { data, error } = await supabase
      .from("manual_receivables")
      .update({ revenue_recognized_at: now, updated_at: now })
      .eq("id", leadId)
      .eq("active", true)
      .select("id, revenue_recognized_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      leadId: data.id,
      revenue_recognized_at: data.revenue_recognized_at,
      message: "Saldo confirmado como receita disponível",
    });
  }

  const { data: lead, error: fetchError } = await supabase
    .from("leads")
    .select("id, status, revenue_recognized_at")
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  if (!["confirmado", "finalizado"].includes(lead.status)) {
    return NextResponse.json(
      { error: "Só é possível liberar receita de eventos confirmados" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .update({ revenue_recognized_at: now })
    .eq("id", leadId)
    .select("id, revenue_recognized_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    leadId: data.id,
    revenue_recognized_at: data.revenue_recognized_at,
    message: "Saldo confirmado como receita disponível",
  });
}

/** Volta o saldo para retido (remove confirmação manual) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const source = new URL(request.url).searchParams.get("source");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (source === "manual") {
    const { data: row } = await supabase
      .from("manual_receivables")
      .select("id, revenue_recognized_at")
      .eq("id", leadId)
      .single();

    if (!row) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    }
    if (!row.revenue_recognized_at) {
      return NextResponse.json(
        { error: "Este saldo não foi liberado manualmente" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("manual_receivables")
      .update({ revenue_recognized_at: null, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Saldo voltou para recebido retido" });
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, revenue_recognized_at")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  if (!lead.revenue_recognized_at) {
    return NextResponse.json(
      { error: "Este saldo não foi liberado manualmente" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("leads")
    .update({ revenue_recognized_at: null })
    .eq("id", leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    message: "Saldo voltou para recebido retido",
  });
}
