import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["rascunho", "enviado", "assinado", "cancelado"]).optional(),
  contratante_name: z.string().nullable().optional(),
  contratante_cpf: z.string().nullable().optional(),
  contratante_phone: z.string().nullable().optional(),
  event_address: z.string().nullable().optional(),
  event_date: z.string().nullable().optional(),
  event_time: z.string().nullable().optional(),
  package_description: z.string().nullable().optional(),
  contract_value: z.number().nullable().optional(),
  body_override: z.string().nullable().optional(),
  signature_city: z.string().nullable().optional(),
  signature_day: z.string().nullable().optional(),
  signature_month: z.string().nullable().optional(),
  signature_year: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lead_id: z.string().uuid().nullable().optional(),
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

  const { data, error } = await supabase
    .from("contracts")
    .select("*, lead:leads(id, name, status, whatsapp, event_date)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  }

  const { data: template } = await supabase
    .from("contract_templates")
    .select("body")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  return NextResponse.json({
    ...data,
    contract_value: data.contract_value != null ? Number(data.contract_value) : null,
    template_body: template?.body ?? null,
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

  const updates: Record<string, unknown> = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.status === "enviado") {
    updates.sent_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", id)
    .select("*, lead:leads(id, name, status)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    ...data,
    contract_value: data.contract_value != null ? Number(data.contract_value) : null,
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

  const { data: contract } = await supabase
    .from("contracts")
    .select("signed_file_path")
    .eq("id", id)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  }

  if (contract.signed_file_path) {
    await supabase.storage.from("contract-documents").remove([contract.signed_file_path]);
  }

  const { error } = await supabase.from("contracts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
