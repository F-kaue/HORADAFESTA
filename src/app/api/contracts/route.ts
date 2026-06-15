import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONTRACT_TEMPLATE, leadToContractFields } from "@/lib/contracts/template";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  lead_id: z.string().uuid().optional(),
  contratante_name: z.string().optional(),
  contratante_cpf: z.string().optional(),
  contratante_phone: z.string().optional(),
  event_address: z.string().optional(),
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  package_description: z.string().optional(),
  contract_value: z.number().optional(),
  body_override: z.string().optional(),
  signature_city: z.string().optional(),
  notes: z.string().optional(),
});

async function getDefaultTemplateBody(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("contract_templates")
    .select("body")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (data?.body) return data.body;

  await supabase.from("contract_templates").insert({
    user_id: userId,
    name: "Contrato padrão — Hora da Festa",
    body: DEFAULT_CONTRACT_TEMPLATE,
    is_default: true,
  });

  return DEFAULT_CONTRACT_TEMPLATE;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");
  const leadId = request.nextUrl.searchParams.get("lead_id");

  let query = supabase
    .from("contracts")
    .select("*, lead:leads(id, name, status)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (leadId) query = query.eq("lead_id", leadId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: (data ?? []).map((c) => ({
      ...c,
      contract_value: c.contract_value != null ? Number(c.contract_value) : null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  type Payload = {
    lead_id?: string;
    contratante_name?: string | null;
    contratante_cpf?: string | null;
    contratante_phone?: string | null;
    event_address?: string | null;
    event_date?: string | null;
    event_time?: string | null;
    package_description?: string | null;
    contract_value?: number | null;
    body_override?: string | null;
    signature_city?: string | null;
    notes?: string | null;
  };

  let payload: Payload = { ...parsed.data };

  if (parsed.data.lead_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", parsed.data.lead_id)
      .single();

    if (lead) {
      const fromLead = leadToContractFields(lead);
      payload = {
        ...fromLead,
        ...Object.fromEntries(
          Object.entries(parsed.data).filter(([, v]) => v != null && v !== "")
        ),
        lead_id: parsed.data.lead_id,
        event_date: fromLead.event_date ?? parsed.data.event_date,
      };
    }
  }

  const now = new Date();
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];

  await getDefaultTemplateBody(supabase, user.id);

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      user_id: user.id,
      lead_id: payload.lead_id ?? null,
      status: "rascunho",
      contratante_name: payload.contratante_name ?? null,
      contratante_cpf: payload.contratante_cpf ?? null,
      contratante_phone: payload.contratante_phone ?? null,
      event_address: payload.event_address ?? null,
      event_date: payload.event_date ?? null,
      event_time: payload.event_time ?? null,
      package_description: payload.package_description ?? null,
      contract_value: payload.contract_value ?? null,
      body_override: payload.body_override ?? null,
      signature_city: payload.signature_city ?? "Fortaleza/CE",
      signature_day: String(now.getDate()).padStart(2, "0"),
      signature_month: months[now.getMonth()],
      signature_year: String(now.getFullYear()),
      notes: payload.notes ?? null,
    })
    .select("*, lead:leads(id, name, status)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    {
      ...data,
      contract_value: data.contract_value != null ? Number(data.contract_value) : null,
    },
    { status: 201 }
  );
}
