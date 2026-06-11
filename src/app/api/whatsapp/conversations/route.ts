import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findChats } from "@/lib/evolution-api";
import { syncChatsFromEvolution } from "@/lib/whatsapp-sync";
import {
  getWhatsAppInstanceName,
  isEvolutionConfigured,
} from "@/lib/whatsapp-instance";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (isEvolutionConfigured()) {
    try {
      const instanceName = await getWhatsAppInstanceName(supabase);
      const chats = await findChats(instanceName);
      await syncChatsFromEvolution(supabase, chats);
    } catch {
      // usa dados locais se Evolution falhar
    }
  }

  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select("*, leads(id, name, status, event_type)")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] });
}
