import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EvolutionMessage } from "@/lib/evolution-api";
import { persistEvolutionMessage } from "@/lib/whatsapp-sync";
import { updateConnectionStatus } from "@/lib/whatsapp-instance";

type WebhookPayload = {
  event?: string;
  instance?: string;
  data?: unknown;
  sender?: string;
  apikey?: string;
};

export async function POST(request: NextRequest) {
  const expectedKey = process.env.EVOLUTION_API_KEY;
  const headerKey = request.headers.get("apikey");

  let body: WebhookPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (expectedKey && headerKey && headerKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const event = body.event ?? "";

  if (event === "CONNECTION_UPDATE" || event === "connection.update") {
    const data = body.data as { state?: string } | undefined;
    const state = data?.state;
    if (state === "open") {
      await updateConnectionStatus(supabase, "connected");
    } else if (state === "connecting") {
      await updateConnectionStatus(supabase, "connecting");
    } else if (state === "close") {
      await updateConnectionStatus(supabase, "disconnected");
    }
    return NextResponse.json({ ok: true });
  }

  if (
    event === "MESSAGES_UPSERT" ||
    event === "messages.upsert" ||
    event === "MESSAGES_UPDATE"
  ) {
    const data = body.data as
      | EvolutionMessage
      | EvolutionMessage[]
      | { messages?: EvolutionMessage[] }
      | undefined;

    let messages: EvolutionMessage[] = [];
    if (Array.isArray(data)) messages = data;
    else if (data && "messages" in data && Array.isArray(data.messages)) {
      messages = data.messages;
    } else if (data && "key" in data) {
      messages = [data as EvolutionMessage];
    }

    const pushName = (body as { pushName?: string }).pushName;

    for (const msg of messages) {
      try {
        await persistEvolutionMessage(supabase, msg, pushName);
      } catch {
        // continua processando outras mensagens
      }
    }
  }

  return NextResponse.json({ ok: true });
}
