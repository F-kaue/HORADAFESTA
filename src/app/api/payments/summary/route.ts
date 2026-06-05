import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAllPaymentSummaries } from "@/lib/payment-server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const byLead = await fetchAllPaymentSummaries(supabase);
  return NextResponse.json({ by_lead: byLead });
}
