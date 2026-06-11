import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findMessages } from "@/lib/evolution-api";
import { persistEvolutionMessage } from "@/lib/whatsapp-sync";
import { getWhatsAppInstanceName, isEvolutionConfigured } from "@/lib/whatsapp-instance";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const conversationId = request.nextUrl.searchParams.get("conversation_id");
  const remoteJid = request.nextUrl.searchParams.get("remote_jid");

  if (!conversationId && !remoteJid) {
    return NextResponse.json({ error: "conversation_id ou remote_jid obrigatório" }, { status: 400 });
  }

  let jid = remoteJid;
  if (conversationId) {
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("remote_jid")
      .eq("id", conversationId)
      .single();
    jid = conv?.remote_jid ?? null;
  }

  if (jid && isEvolutionConfigured()) {
    try {
      const instanceName = await getWhatsAppInstanceName(supabase);
      const msgs = await findMessages(instanceName, jid, 80);
      for (const msg of msgs) {
        try {
          await persistEvolutionMessage(supabase, msg);
        } catch {
          // ignora duplicatas
        }
      }
    } catch {
      // usa cache local
    }
  }

  let query = supabase
    .from("whatsapp_messages")
    .select("*")
    .order("sent_at", { ascending: true })
    .limit(200);

  if (conversationId) {
    query = query.eq("conversation_id", conversationId);
  } else if (jid) {
    query = query.eq("remote_jid", jid);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (conversationId) {
    await supabase
      .from("whatsapp_conversations")
      .update({ unread_count: 0 })
      .eq("id", conversationId);
  }

  return NextResponse.json({ messages: data ?? [] });
}
