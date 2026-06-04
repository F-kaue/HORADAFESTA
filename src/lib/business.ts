import type { SupabaseClient } from "@supabase/supabase-js";

const PLACEHOLDER_SUFFIX = "9999999999";

export function isValidBusinessWhatsApp(whatsapp: string | null | undefined): boolean {
  const digits = (whatsapp ?? "").replace(/\D/g, "");
  return digits.length >= 10 && !digits.endsWith(PLACEHOLDER_SUFFIX);
}

/** WhatsApp do buffet: prioriza OWNER_USER_ID, senão qualquer perfil válido */
export async function getBusinessWhatsApp(
  admin: SupabaseClient
): Promise<string | null> {
  const { data: profiles } = await admin.from("profiles").select("id, whatsapp");

  const ownerId = process.env.OWNER_USER_ID;
  if (ownerId) {
    const owner = profiles?.find((p) => p.id === ownerId);
    if (owner && isValidBusinessWhatsApp(owner.whatsapp)) {
      return owner.whatsapp!.replace(/\D/g, "");
    }
  }

  for (const p of profiles ?? []) {
    if (isValidBusinessWhatsApp(p.whatsapp)) {
      return p.whatsapp!.replace(/\D/g, "");
    }
  }

  return null;
}

/** Perfil de referência para agenda/disponibilidade (OWNER ou primeiro perfil) */
export async function getBusinessProfile(
  admin: SupabaseClient
): Promise<Record<string, unknown> | null> {
  const ownerId = process.env.OWNER_USER_ID;
  if (ownerId) {
    const { data } = await admin.from("profiles").select("*").eq("id", ownerId).maybeSingle();
    if (data) return data;
  }
  const { data } = await admin.from("profiles").select("*").limit(1).maybeSingle();
  return data;
}
