/**
 * Cliente Evolution API v2 — WhatsApp via QR Code (Baileys)
 * Docs: https://doc.evolution-api.com/v2
 */

const DEFAULT_INSTANCE = "horadafesta";

export type ConnectionState = "open" | "connecting" | "close";

function getConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) {
    return null;
  }
  return { baseUrl, apiKey };
}

export function isEvolutionConfigured(): boolean {
  return Boolean(getConfig());
}

export function defaultInstanceName(): string {
  return process.env.WHATSAPP_INSTANCE_NAME || DEFAULT_INSTANCE;
}

async function evolutionFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();
  if (!config) throw new Error("Evolution API não configurada");

  const res = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers: {
      apikey: config.apiKey,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = data as { message?: string; error?: string };
    throw new Error(err.message || err.error || `Evolution API ${res.status}`);
  }

  return data as T;
}

export async function createInstance(
  instanceName: string,
  webhookUrl: string
): Promise<void> {
  await evolutionFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: [
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
        ],
      },
    }),
  });
}

export async function getConnectionState(
  instanceName: string
): Promise<{ state: ConnectionState }> {
  const data = await evolutionFetch<{
    instance?: { state?: ConnectionState };
    state?: ConnectionState;
  }>(`/instance/connectionState/${encodeURIComponent(instanceName)}`);

  const state = data.instance?.state ?? data.state ?? "close";
  return { state };
}

export async function connectInstance(instanceName: string): Promise<{
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}> {
  return evolutionFetch(`/instance/connect/${encodeURIComponent(instanceName)}`);
}

export async function logoutInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/logout/${encodeURIComponent(instanceName)}`, {
    method: "DELETE",
  });
}

export async function sendTextMessage(
  instanceName: string,
  number: string,
  text: string
): Promise<{ key?: { id?: string } }> {
  const digits = number.replace(/\D/g, "");
  return evolutionFetch(`/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    body: JSON.stringify({ number: digits, text }),
  });
}

export type EvolutionChat = {
  id?: string;
  remoteJid?: string;
  name?: string;
  pushName?: string;
  profilePicUrl?: string;
  updatedAt?: string;
  lastMessage?: {
    message?: string;
    messageTimestamp?: number;
  };
  unreadCount?: number;
};

export async function findChats(instanceName: string): Promise<EvolutionChat[]> {
  const data = await evolutionFetch<EvolutionChat[] | { chats?: EvolutionChat[] }>(
    `/chat/findChats/${encodeURIComponent(instanceName)}`
  );
  if (Array.isArray(data)) return data;
  return data.chats ?? [];
}

export type EvolutionMessage = {
  key?: {
    id?: string;
    remoteJid?: string;
    fromMe?: boolean;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string };
  };
  messageTimestamp?: number | string;
  status?: string;
};

export async function findMessages(
  instanceName: string,
  remoteJid: string,
  limit = 50
): Promise<EvolutionMessage[]> {
  const data = await evolutionFetch<
    EvolutionMessage[] | { messages?: { records?: EvolutionMessage[] } }
  >(`/chat/findMessages/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    body: JSON.stringify({
      where: { key: { remoteJid } },
      limit,
    }),
  });

  if (Array.isArray(data)) return data;
  return data.messages?.records ?? [];
}

export function extractMessageBody(msg: EvolutionMessage): string {
  const m = msg.message;
  if (!m) return "";
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return m.imageMessage.caption;
  return "[mídia]";
}

export function jidToPhone(jid: string): string {
  return jid.replace(/@.*/, "").replace(/\D/g, "");
}

export function phoneToJid(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}
