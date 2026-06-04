import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().min(2),
  whatsapp: z.string().min(10),
  event_date: z.string().optional(),
  slot_type: z.enum(["manha", "tarde", "noite", "dia_todo"]).optional(),
  location: z.string().min(2),
  neighborhood: z.string().min(2),
  guest_count: z.number().min(1),
  event_type: z.string(),
  observations: z.string().optional(),
});

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ownerId = process.env.OWNER_USER_ID;
  if (!ownerId) {
    return NextResponse.json(
      { error: "Sistema não configurado" },
      { status: 500 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const admin = createAdminClient();

  const oneHourAgo = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json(
      { error: "Muitas solicitações. Tente novamente em uma hora." },
      { status: 429 }
    );
  }

  await admin.from("rate_limits").insert({ ip_address: ip });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .from("leads")
    .insert({ ...parsed.data, user_id: ownerId, status: "novo" })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("whatsapp")
    .eq("id", ownerId)
    .single();

  return NextResponse.json({
    leadId: data.id,
    whatsapp: profile?.whatsapp || process.env.DEFAULT_WHATSAPP || "",
  });
}
