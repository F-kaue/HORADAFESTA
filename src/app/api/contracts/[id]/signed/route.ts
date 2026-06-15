import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_SIZE = 15 * 1024 * 1024;
const ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

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

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, signed_file_path")
    .eq("id", id)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 15MB)" }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use PDF, JPG ou PNG." },
      { status: 400 }
    );
  }

  if (contract.signed_file_path) {
    await supabase.storage.from("contract-documents").remove([contract.signed_file_path]);
  }

  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${user.id}/${id}/assinado-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("contract-documents")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("contracts")
    .update({
      signed_file_path: path,
      signed_file_name: file.name,
      signed_at: now,
      status: "assinado",
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

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

  const { data: contract } = await supabase
    .from("contracts")
    .select("signed_file_path, signed_file_name")
    .eq("id", id)
    .single();

  if (!contract?.signed_file_path) {
    return NextResponse.json({ error: "Nenhum arquivo anexado" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("contract-documents")
    .createSignedUrl(contract.signed_file_path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Erro ao gerar link" }, { status: 500 });
  }

  return NextResponse.json({
    url: data.signedUrl,
    fileName: contract.signed_file_name,
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
    .select("signed_file_path, status, sent_at")
    .eq("id", id)
    .single();

  if (!contract?.signed_file_path) {
    return NextResponse.json({ error: "Nenhum arquivo" }, { status: 404 });
  }

  await supabase.storage.from("contract-documents").remove([contract.signed_file_path]);

  const { error } = await supabase
    .from("contracts")
    .update({
      signed_file_path: null,
      signed_file_name: null,
      signed_at: null,
      status: contract.sent_at ? "enviado" : "rascunho",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
