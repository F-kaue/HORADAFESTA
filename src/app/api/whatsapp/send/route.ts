import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTextMessage, phoneToJid } from "@/lib/evolution-api";
import { upsertConversation } from "@/lib/whatsapp-sync";
import {
  getWhatsAppInstanceName,
  isEvolutionConfigured,
} from "@/lib/whatsapp-instance";
import { z } from "zod";

const schema = z.object({
  conversation_id: z.string().uuid().optional(),
  remote_jid: z.string().optional(),
  phone: z.string().optional(),
  text: z.string().min(1).max(4096),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ error: "WhatsApp não configurado" }, { status: 503 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { conversation_id, remote_jid, phone, text } = parsed.data;

  let jid = remote_jid;
  let convId = conversation_id;

  if (conversation_id) {
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("id, remote_jid, phone")
      .eq("id", conversation_id)
      .single();
    if (!conv) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    jid = conv.remote_jid;
    convId = conv.id;
  } else if (phone) {
    jid = phoneToJid(phone);
  }

  if (!jid) {
    return NextResponse.json({ error: "Destinatário não informado" }, { status: 400 });
  }

  const instanceName = await getWhatsAppInstanceName(supabase);
  const digits = jid.replace(/@.*/, "").replace(/\D/g, "");

  try {
    const result = await sendTextMessage(instanceName, digits, text);
    const now = new Date();

    if (!convId) {
      convId = await upsertConversation(supabase, {
        remoteJid: jid,
        lastMessage: text,
        lastMessageAt: now,
        incrementUnread: false,
      });
    } else {
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_message: text,
          last_message_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", convId);
    }

    if (convId) {
      await supabase.from("whatsapp_messages").insert({
        conversation_id: convId,
        external_id: result.key?.id ?? null,
        remote_jid: jid,
        from_me: true,
        body: text,
        message_type: "text",
        sent_at: now.toISOString(),
        status: "sent",
      });
    }

    return NextResponse.json({ ok: true, conversation_id: convId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao enviar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
