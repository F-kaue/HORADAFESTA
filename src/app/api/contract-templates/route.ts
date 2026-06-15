import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONTRACT_TEMPLATE } from "@/lib/contracts/template";

export const dynamic = "force-dynamic";

async function ensureDefaultTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: existing } = await supabase
    .from("contract_templates")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("contract_templates")
    .insert({
      user_id: userId,
      name: "Contrato padrão — Hora da Festa",
      body: DEFAULT_CONTRACT_TEMPLATE,
      is_default: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await ensureDefaultTemplate(supabase, user.id);

  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { id, name, body: templateBody } = body as {
    id?: string;
    name?: string;
    body?: string;
  };

  if (!templateBody || templateBody.trim().length < 50) {
    return NextResponse.json({ error: "Modelo muito curto" }, { status: 400 });
  }

  const template = await ensureDefaultTemplate(supabase, user.id);
  const targetId = id ?? template.id;

  const { data, error } = await supabase
    .from("contract_templates")
    .update({
      name: name ?? undefined,
      body: templateBody,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
