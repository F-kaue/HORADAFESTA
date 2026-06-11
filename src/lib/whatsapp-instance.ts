import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createInstance,
  defaultInstanceName,
  getConnectionState,
  isEvolutionConfigured,
} from "@/lib/evolution-api";
import { getBusinessProfile } from "@/lib/business";

export async function getWhatsAppInstanceName(
  supabase: SupabaseClient
): Promise<string> {
  const profile = await getBusinessProfile(supabase);
  const fromProfile = profile?.whatsapp_instance_name as string | undefined;
  return fromProfile || defaultInstanceName();
}

export async function ensureWhatsAppInstance(
  supabase: SupabaseClient,
  webhookUrl: string
): Promise<string> {
  const instanceName = await getWhatsAppInstanceName(supabase);
  const profile = await getBusinessProfile(supabase);
  const ownerId = (profile?.id as string) ?? process.env.OWNER_USER_ID;

  if (!profile?.whatsapp_instance_name && ownerId) {
    await supabase
      .from("profiles")
      .update({ whatsapp_instance_name: instanceName })
      .eq("id", ownerId);
  }

  try {
    await getConnectionState(instanceName);
  } catch {
    try {
      await createInstance(instanceName, webhookUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.toLowerCase().includes("already") && !msg.includes("403")) {
        throw err;
      }
    }
  }

  return instanceName;
}

export async function updateConnectionStatus(
  supabase: SupabaseClient,
  status: "disconnected" | "connecting" | "connected"
) {
  const ownerId = process.env.OWNER_USER_ID;
  if (!ownerId) return;
  await supabase
    .from("profiles")
    .update({ whatsapp_connection_status: status })
    .eq("id", ownerId);
}

export function getWebhookUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/whatsapp/webhook`;
}

export { isEvolutionConfigured };
