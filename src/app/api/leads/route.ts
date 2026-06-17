import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLeadSchema } from "@/lib/lead-schema";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ownerId = process.env.OWNER_USER_ID ?? user.id;

  const parsed = createLeadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { mark_as_finalized, ...leadData } = parsed.data;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
  }).format(new Date());

  const isPastEvent =
    leadData.event_date && leadData.event_date < today;
  const status =
    mark_as_finalized && isPastEvent ? "finalizado" : "novo";

  const insertPayload: Record<string, unknown> = {
    ...leadData,
    user_id: ownerId,
    status,
  };
  if (status === "finalizado") {
    insertPayload.finalized_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("leads")
    .insert(insertPayload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
