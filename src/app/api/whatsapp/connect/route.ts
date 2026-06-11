import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { connectInstance } from "@/lib/evolution-api";
import {
  ensureWhatsAppInstance,
  getWebhookUrl,
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
    return NextResponse.json(
      { error: "Evolution API não configurada. Contate o administrador." },
      { status: 503 }
    );
  }

  try {
    const instanceName = await ensureWhatsAppInstance(supabase, getWebhookUrl());
    await updateConnectionStatus(supabase, "connecting");
    const qr = await connectInstance(instanceName);

    const base64 = qr.base64
      ? qr.base64.startsWith("data:")
        ? qr.base64
        : `data:image/png;base64,${qr.base64}`
      : null;

    return NextResponse.json({
      instanceName,
      base64,
      pairingCode: qr.pairingCode ?? qr.code ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao conectar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
