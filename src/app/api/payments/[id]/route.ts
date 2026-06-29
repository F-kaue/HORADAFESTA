import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncLeadGoogleCalendarPayment } from "@/lib/google-calendar-payment";
import { updatePaymentContractTotal } from "@/lib/payment-server";
import { z } from "zod";

const patchSchema = z.object({
  total_value: z.number().positive(),
});

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

  const result = await updatePaymentContractTotal(
    supabase,
    id,
    parsed.data.total_value
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    await syncLeadGoogleCalendarPayment(supabase, result.bundle.payment.lead_id);
  } catch {
    // sync opcional
  }

  return NextResponse.json(result.bundle);
}
