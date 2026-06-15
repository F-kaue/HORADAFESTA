import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEventTypes, fetchServiceTypes } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function createAnonServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Catálogo público para o formulário /orcamento — sempre do banco, sem cache */
export async function GET() {
  try {
    let supabase;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = createAnonServerClient();
    }

    const [eventTypes, serviceTypes] = await Promise.all([
      fetchEventTypes(supabase, true),
      fetchServiceTypes(supabase, true),
    ]);

    return NextResponse.json(
      { event_types: eventTypes, service_types: serviceTypes },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar catálogo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
