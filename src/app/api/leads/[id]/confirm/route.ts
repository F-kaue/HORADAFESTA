import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadGoogleCalendarPayment } from "@/lib/google-calendar-payment";
import { createPaymentPlanForLead } from "@/lib/payment-server";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { roundMoney } from "@/lib/payments";
import {
  derivedEventTimes,
  formatSlotsLabel,
  normalizeSlotSelection,
  SLOT_LABELS,
  validateSlotsAgainstOccupied,
  type SlotType,
} from "@/lib/slots";
import { z } from "zod";

const slotEnum = z.enum(["manha", "tarde", "noite", "dia_todo"]);

const schema = z.object({
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot_types: z.array(slotEnum).min(1).optional(),
  slot_type: slotEnum.optional(),
  event_start_time: z.string().optional(),
  event_end_time: z.string().optional(),
  total_value: z.number().positive(),
  internal_notes: z.string().optional(),
  down_payment: z.number().min(0).default(0),
  installments: z.number().int().min(1).max(24).default(1),
  payment_type: z.enum(["avista", "parcelado"]).default("parcelado"),
  down_payment_paid: z.boolean().default(false),
  down_payment_paid_date: z.string().optional(),
  first_installment_due_date: z.string().optional(),
});

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

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const slotTypes = normalizeSlotSelection(
    parsed.data.slot_types?.length
      ? (parsed.data.slot_types as SlotType[])
      : parsed.data.slot_type
        ? [parsed.data.slot_type as SlotType]
        : []
  );

  if (slotTypes.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um turno" }, { status: 400 });
  }

  const entrada = roundMoney(parsed.data.down_payment);
  if (entrada > parsed.data.total_value) {
    return NextResponse.json(
      { error: "A entrada não pode ser maior que o valor total" },
      { status: 400 }
    );
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const eventDate = parsed.data.event_date;

  const { data: occupiedRows } = await supabase
    .from("event_slots")
    .select("slot_type")
    .eq("event_date", eventDate)
    .eq("status", "confirmado")
    .neq("lead_id", id);

  const occupied = (occupiedRows ?? []).map((r) => r.slot_type as SlotType);
  const slotCheck = validateSlotsAgainstOccupied(slotTypes, occupied);
  if (!slotCheck.ok) {
    return NextResponse.json(
      {
        error: `O turno "${SLOT_LABELS[slotCheck.slot]}" já está ocupado nesta data. Escolha outro horário ou data.`,
      },
      { status: 409 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_calendar_token, google_calendar_id")
    .eq("id", user.id)
    .single();

  const turnosLabel = formatSlotsLabel(slotTypes);

  let googleEventId: string | null = null;
  if (profile?.google_calendar_token) {
    const description = [
      `Cliente: ${lead.name}`,
      `WhatsApp: ${lead.whatsapp}`,
      `Local: ${lead.location} - ${lead.neighborhood}`,
      `Convidados: ~${lead.guest_count}`,
      `Tipo: ${lead.event_type}`,
      `Turnos: ${turnosLabel}`,
      lead.observations ? `Obs: ${lead.observations}` : "",
      parsed.data.internal_notes ? `Notas: ${parsed.data.internal_notes}` : "",
      entrada > 0 ? `Entrada: R$ ${entrada.toFixed(2)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    googleEventId = await createGoogleCalendarEvent(
      profile.google_calendar_token as Record<string, unknown>,
      {
        title: `🎉 ${lead.event_type} — ${lead.name}`,
        description,
        date: eventDate,
        slotTypes,
        startTime: parsed.data.event_start_time,
        endTime: parsed.data.event_end_time,
        calendarId: profile.google_calendar_id ?? undefined,
      }
    );
  }

  const primarySlot = slotTypes[0];
  const { start: eventStart, end: eventEnd } = derivedEventTimes(
    slotTypes,
    parsed.data.event_start_time,
    parsed.data.event_end_time
  );

  const { data: updated, error } = await supabase
    .from("leads")
    .update({
      status: "confirmado",
      event_date: eventDate,
      slot_type: primarySlot,
      slot_types: slotTypes,
      event_start_time: eventStart,
      event_end_time: eventEnd,
      total_value: parsed.data.total_value,
      internal_notes: parsed.data.internal_notes,
      confirmed_at: new Date().toISOString(),
      google_event_id: googleEventId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("event_slots").delete().eq("lead_id", id);

  const slotRows = slotTypes.map((slot_type) => ({
    user_id: user.id,
    event_date: eventDate,
    slot_type,
    lead_id: id,
    status: "confirmado" as const,
    google_event_id: googleEventId,
  }));

  const { error: slotError } = await supabase.from("event_slots").insert(slotRows);
  if (slotError) {
    return NextResponse.json({ error: slotError.message }, { status: 500 });
  }

  const planResult = await createPaymentPlanForLead(supabase, {
    leadId: id,
    userId: user.id,
    totalValue: parsed.data.total_value,
    downPayment: entrada,
    installments: parsed.data.installments,
    paymentType: parsed.data.payment_type,
    downPaymentPaid: parsed.data.down_payment_paid,
    downPaymentPaidDate: parsed.data.down_payment_paid_date,
    firstInstallmentDueDate: parsed.data.first_installment_due_date,
  });

  if (!planResult.ok) {
    return NextResponse.json(
      { error: `Evento confirmado, mas plano financeiro falhou: ${planResult.error}` },
      { status: 500 }
    );
  }

  try {
    await syncLeadGoogleCalendarPayment(supabase, id);
  } catch {
    // Google sync opcional
  }

  return NextResponse.json({
    lead: updated,
    googleEventId,
    message:
      entrada > 0
        ? `Evento confirmado (${turnosLabel}) com entrada e plano criados! 🎉`
        : `Evento confirmado (${turnosLabel}) e plano de pagamento criados! 🎉`,
  });
}
