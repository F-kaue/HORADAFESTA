import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadGoogleCalendarFinalized } from "@/lib/google-calendar-finalize";
import { syncLeadGoogleCalendarDetails } from "@/lib/google-calendar-lead";
import { z } from "zod";

const CALENDAR_SYNC_FIELDS = new Set([
  "name",
  "whatsapp",
  "event_date",
  "event_start_time",
  "event_end_time",
  "service_type",
  "location",
  "neighborhood",
  "guest_count",
  "event_type",
  "observations",
  "internal_notes",
]);

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    whatsapp: z.string().min(10).optional(),
    event_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    event_start_time: z.string().nullable().optional(),
    event_end_time: z.string().nullable().optional(),
    service_type: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    neighborhood: z.string().nullable().optional(),
    guest_count: z.number().int().positive().optional(),
    event_type: z.string().nullable().optional(),
    observations: z.string().nullable().optional(),
    internal_notes: z.string().nullable().optional(),
    status: z
      .enum([
        "novo",
        "em_conversa",
        "aguardando",
        "confirmado",
        "finalizado",
        "nao_convertido",
      ])
      .optional(),
    archived_at: z.string().nullable().optional(),
    finalized_at: z.string().nullable().optional(),
  })
  .strict();

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

  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error || !data) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }
  return NextResponse.json(data);
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

  const raw = await request.json();
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const body = parsed.data;

  if (body.status === "confirmado") {
    const { data: current } = await supabase
      .from("leads")
      .select("status, confirmed_at")
      .eq("id", id)
      .single();

    if (current?.status !== "confirmado" && !current?.confirmed_at) {
      return NextResponse.json(
        {
          error:
            "Para confirmar um lead, use a aba Confirmação no detalhe do card (não arraste para a coluna Confirmado).",
        },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("leads")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let googleCalendarSynced = false;
  let googleCalendarCreated = false;
  let googleCalendarError: string | undefined;

  const shouldSyncCalendar = Object.keys(body).some((key) =>
    CALENDAR_SYNC_FIELDS.has(key)
  );

  if (shouldSyncCalendar) {
    try {
      const calendar = await syncLeadGoogleCalendarDetails(supabase, id, user.id);
      googleCalendarSynced = calendar.synced;
      googleCalendarCreated = calendar.created;
      googleCalendarError = calendar.error;
      if (calendar.created) {
        const { data: refreshed } = await supabase
          .from("leads")
          .select("*")
          .eq("id", id)
          .single();
        if (refreshed) {
          Object.assign(data, refreshed);
        }
      }
    } catch {
      googleCalendarError = "Erro ao sincronizar Google Calendar.";
    }
  }

  if (body.status === "finalizado" && data) {
    try {
      await syncLeadGoogleCalendarFinalized(supabase, id, user.id);
    } catch {
      // sync opcional
    }
  }

  return NextResponse.json({
    ...data,
    googleCalendarSynced,
    googleCalendarCreated,
    googleCalendarError,
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

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
