import type { SupabaseClient } from "@supabase/supabase-js";
import {
  extractMessageBody,
  jidToPhone,
  type EvolutionMessage,
} from "@/lib/evolution-api";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("55")) return digits.slice(2);
  return digits;
}

async function findLeadByPhone(
  supabase: SupabaseClient,
  phone: string
): Promise<string | null> {
  const target = normalizePhone(phone);
  const { data: leads } = await supabase
    .from("leads")
    .select("id, whatsapp")
    .order("arrived_at", { ascending: false })
    .limit(500);

  for (const lead of leads ?? []) {
    if (normalizePhone(lead.whatsapp) === target) return lead.id;
  }
  return null;
}

export async function upsertConversation(
  supabase: SupabaseClient,
  params: {
    remoteJid: string;
    contactName?: string | null;
    lastMessage?: string | null;
    lastMessageAt?: Date;
    incrementUnread?: boolean;
    profilePictureUrl?: string | null;
  }
) {
  const phone = jidToPhone(params.remoteJid);
  const leadId = await findLeadByPhone(supabase, phone);

  const { data: existing } = await supabase
    .from("whatsapp_conversations")
    .select("id, unread_count")
    .eq("remote_jid", params.remoteJid)
    .maybeSingle();

  const unread = params.incrementUnread
    ? (existing?.unread_count ?? 0) + 1
    : existing?.unread_count ?? 0;

  const row = {
    remote_jid: params.remoteJid,
    phone,
    contact_name: params.contactName ?? null,
    last_message: params.lastMessage ?? null,
    last_message_at: params.lastMessageAt?.toISOString() ?? new Date().toISOString(),
    unread_count: unread,
    lead_id: leadId,
    profile_picture_url: params.profilePictureUrl ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase
      .from("whatsapp_conversations")
      .update(row)
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted } = await supabase
    .from("whatsapp_conversations")
    .insert(row)
    .select("id")
    .single();

  return inserted?.id ?? null;
}

export async function persistEvolutionMessage(
  supabase: SupabaseClient,
  msg: EvolutionMessage,
  pushName?: string
) {
  const remoteJid = msg.key?.remoteJid;
  if (!remoteJid || remoteJid.includes("@g.us")) return;

  const body = extractMessageBody(msg);
  const fromMe = msg.key?.fromMe ?? false;
  const externalId = msg.key?.id;
  const ts = msg.messageTimestamp
    ? new Date(Number(msg.messageTimestamp) * 1000)
    : new Date();

  const conversationId = await upsertConversation(supabase, {
    remoteJid,
    contactName: pushName,
    lastMessage: body,
    lastMessageAt: ts,
    incrementUnread: !fromMe,
  });

  if (!conversationId) return;

  if (externalId) {
    const { data: dup } = await supabase
      .from("whatsapp_messages")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();
    if (dup) return;
  }

  await supabase.from("whatsapp_messages").insert({
    conversation_id: conversationId,
    external_id: externalId,
    remote_jid: remoteJid,
    from_me: fromMe,
    body,
    message_type: "text",
    sent_at: ts.toISOString(),
    status: msg.status ?? null,
  });
}

export async function syncChatsFromEvolution(
  supabase: SupabaseClient,
  chats: Array<{
    remoteJid?: string;
    id?: string;
    name?: string;
    pushName?: string;
    profilePicUrl?: string;
    updatedAt?: string;
    lastMessage?: { message?: string; messageTimestamp?: number };
    unreadCount?: number;
  }>
) {
  for (const chat of chats) {
    const remoteJid = chat.remoteJid ?? chat.id;
    if (!remoteJid || remoteJid.includes("@g.us")) continue;

    const phone = jidToPhone(remoteJid);
    const leadId = await findLeadByPhone(supabase, phone);
    const lastMsg = chat.lastMessage?.message ?? null;
    const lastAt = chat.lastMessage?.messageTimestamp
      ? new Date(chat.lastMessage.messageTimestamp * 1000)
      : chat.updatedAt
        ? new Date(chat.updatedAt)
        : new Date();

    await supabase.from("whatsapp_conversations").upsert(
      {
        remote_jid: remoteJid,
        phone,
        contact_name: chat.pushName || chat.name || null,
        last_message: lastMsg,
        last_message_at: lastAt.toISOString(),
        unread_count: chat.unreadCount ?? 0,
        lead_id: leadId,
        profile_picture_url: chat.profilePicUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "remote_jid" }
    );
  }
}
