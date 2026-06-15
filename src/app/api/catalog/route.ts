import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEventTypes, fetchServiceTypes } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Catálogo público para o formulário /orcamento */
export async function GET() {
  const supabase = createAdminClient();
  const [eventTypes, serviceTypes] = await Promise.all([
    fetchEventTypes(supabase, true),
    fetchServiceTypes(supabase, true),
  ]);

  return NextResponse.json(
    { event_types: eventTypes, service_types: serviceTypes },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
