import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadGoogleCalendarPayment } from "@/lib/google-calendar-payment";
import { createPaymentPlanForLead } from "@/lib/payment-server";
import { createCalendarEventForLead } from "@/lib/google-calendar-lead";
import { roundMoney } from "@/lib/payments";
import { formatTimeRange } from "@/lib/event-time";
import { getBusinessProfile } from "@/lib/business";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const schema = z.object({
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service_type: z.string().min(1),
  event_start_time: z.string().min(4),
  event_end_time: z.string().min(4),
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

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const eventDate = parsed.data.event_date;
  const startTime = parsed.data.event_start_time.slice(0, 5);
  const endTime = parsed.data.event_end_time.slice(0, 5);

  const admin = createAdminClient();
  const profile = await getBusinessProfile(admin);
  const maxEvents = Number(profile?.max_events_per_day ?? 2);

  const { count } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("event_date", eventDate)
    .eq("status", "confirmado")
    .neq("id", id);

  if ((count ?? 0) >= maxEvents) {
    return NextResponse.json(
      { error: "Esta data já está lotada. Escolha outra data." },
      { status: 409 }
    );
  }

  const scheduleLabel = formatTimeRange(startTime, endTime);
  const serviceLabel = parsed.data.service_type;

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("google_calendar_token, google_calendar_id")
    .eq("id", user.id)
    .single();

  let googleEventId: string | null = null;
  let googleCalendarError: string | undefined;
  if (userProfile?.google_calendar_token) {
    const calendarResult = await createCalendarEventForLead(supabase, user.id, lead, {
      serviceType: serviceLabel,
      internalNotes: parsed.data.internal_notes,
      downPayment: entrada,
    });
    googleEventId = calendarResult.eventId;
    googleCalendarError = calendarResult.error;
  } else {
    googleCalendarError = "Conecte o Google Calendar em Configurações para criar o evento.";
  }

  const { data: updated, error } = await supabase
    .from("leads")
    .update({
      status: "confirmado",
      event_date: eventDate,
      service_type: serviceLabel,
      event_start_time: startTime,
      event_end_time: endTime,
      slot_type: null,
      slot_types: null,
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
    await syncLeadGoogleCalendarPayment(supabase, id, user.id);
  } catch {
    // Google sync opcional
  }

  return NextResponse.json({
    lead: updated,
    googleEventId,
    googleCalendarError,
    message:
      entrada > 0
        ? `Evento confirmado (${scheduleLabel}) com entrada e plano criados! 🎉`
        : `Evento confirmado (${scheduleLabel}) e plano de pagamento criados! 🎉`,
  });
}
