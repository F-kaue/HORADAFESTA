import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConnectionState } from "@/lib/evolution-api";
import {
  getWhatsAppInstanceName,
  isEvolutionConfigured,
  updateConnectionStatus,
} from "@/lib/whatsapp-instance";
import { getBusinessProfile } from "@/lib/business";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!isEvolutionConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      status: "disconnected",
      message: "Evolution API não configurada no servidor",
    });
  }

  const profile = await getBusinessProfile(supabase);
  const instanceName = await getWhatsAppInstanceName(supabase);

  try {
    const { state } = await getConnectionState(instanceName);
    const connected = state === "open";
    const status = connected
      ? "connected"
      : state === "connecting"
        ? "connecting"
        : "disconnected";

    await updateConnectionStatus(supabase, status);

    return NextResponse.json({
      configured: true,
      connected,
      status,
      instanceName,
      profileStatus: profile?.whatsapp_connection_status ?? status,
    });
  } catch {
    return NextResponse.json({
      configured: true,
      connected: false,
      status: "disconnected",
      instanceName,
    });
  }
}
