import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logoutInstance } from "@/lib/evolution-api";
import {
  getWhatsAppInstanceName,
  isEvolutionConfigured,
  updateConnectionStatus,
} from "@/lib/whatsapp-instance";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 });
  }

  const instanceName = await getWhatsAppInstanceName(supabase);
  try {
    await logoutInstance(instanceName);
    await updateConnectionStatus(supabase, "disconnected");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao desconectar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
