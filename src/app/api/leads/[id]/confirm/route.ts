import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPaymentPlanForLead } from "@/lib/payment-server";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { roundMoney } from "@/lib/payments";
import { z } from "zod";

const schema = z.object({
  slot_type: z.enum(["manha", "tarde", "noite", "dia_todo"]),
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

  if (!lead?.event_date) {
    return NextResponse.json({ error: "Lead sem data" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_calendar_token, google_calendar_id")
    .eq("id", user.id)
    .single();

  let googleEventId: string | null = null;
  if (profile?.google_calendar_token) {
    const description = [
      `Cliente: ${lead.name}`,
      `WhatsApp: ${lead.whatsapp}`,
      `Local: ${lead.location} - ${lead.neighborhood}`,
      `Convidados: ~${lead.guest_count}`,
      `Tipo: ${lead.event_type}`,
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
        date: lead.event_date,
        slotType: parsed.data.slot_type,
        startTime: parsed.data.event_start_time,
        endTime: parsed.data.event_end_time,
        calendarId: profile.google_calendar_id ?? undefined,
      }
    );
  }

  const { data: updated, error } = await supabase
    .from("leads")
    .update({
      status: "confirmado",
      slot_type: parsed.data.slot_type,
      event_start_time: parsed.data.event_start_time,
      event_end_time: parsed.data.event_end_time,
      total_value: parsed.data.total_value,
      internal_notes: parsed.data.internal_notes,
      confirmed_at: new Date().toISOString(),
      google_event_id: googleEventId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: existingSlot } = await supabase
    .from("event_slots")
    .select("id")
    .eq("lead_id", id)
    .eq("status", "confirmado")
    .maybeSingle();

  if (!existingSlot) {
    const { error: slotError } = await supabase.from("event_slots").insert({
      user_id: user.id,
      event_date: lead.event_date,
      slot_type: parsed.data.slot_type,
      lead_id: id,
      status: "confirmado",
      google_event_id: googleEventId,
    });
    if (slotError) {
      return NextResponse.json({ error: slotError.message }, { status: 500 });
    }
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

  return NextResponse.json({
    lead: updated,
    googleEventId,
    message:
      entrada > 0
        ? "Evento confirmado com entrada e plano de pagamento criados! 🎉"
        : "Evento confirmado e plano de pagamento criados! 🎉",
  });
}
