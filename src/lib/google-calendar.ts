import { derivedEventTimes, type SlotType } from "./slots";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface GoogleTokens {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
}

async function refreshAccessToken(
  tokens: GoogleTokens
): Promise<GoogleTokens> {
  if (
    tokens.access_token &&
    tokens.expiry_date &&
    tokens.expiry_date > Date.now()
  ) {
    return tokens;
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token!,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  return {
    ...tokens,
    access_token: data.access_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

function slotFromHour(hour: number): SlotType {
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

export async function getGoogleCalendarBusyDates(
  tokenData: Record<string, unknown>,
  startDate: string,
  endDate: string
): Promise<Record<string, SlotType[]>> {
  const tokens = await refreshAccessToken(tokenData as GoogleTokens);
  const timeMin = new Date(startDate + "T00:00:00").toISOString();
  const timeMax = new Date(endDate + "T23:59:59").toISOString();

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?` +
      new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
      }),
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  if (!res.ok) return {};

  const data = await res.json();
  const result: Record<string, SlotType[]> = {};

  for (const event of data.items ?? []) {
    const start = event.start?.dateTime || event.start?.date;
    if (!start) continue;
    const date = start.slice(0, 10);
    const hour = start.includes("T")
      ? parseInt(start.slice(11, 13), 10)
      : 0;

    const isAllDay = !event.start?.dateTime;
    const slot: SlotType = isAllDay ? "dia_todo" : slotFromHour(hour);

    if (!result[date]) result[date] = [];
    if (!result[date].includes(slot)) result[date].push(slot);
  }

  return result;
}

export async function createGoogleCalendarEvent(
  tokenData: Record<string, unknown>,
  params: {
    title: string;
    description: string;
    date: string;
    slotType?: SlotType;
    slotTypes?: SlotType[];
    startTime?: string;
    endTime?: string;
    calendarId?: string;
  }
): Promise<{ eventId: string | null; error?: string }> {
  const tokens = await refreshAccessToken(tokenData as GoogleTokens);
  let start: string;
  let end: string;
  if (params.startTime && params.endTime) {
    start = params.startTime.slice(0, 5);
    end = params.endTime.slice(0, 5);
  } else {
    const slots =
      params.slotTypes?.length
        ? params.slotTypes
        : params.slotType
          ? [params.slotType]
          : (["tarde"] as SlotType[]);
    const derived = derivedEventTimes(slots, params.startTime, params.endTime);
    start = derived.start;
    end = derived.end;
  }

  const startDateTime = `${params.date}T${start}:00`;
  const endDateTime = `${params.date}T${end}:00`;

  const calendarId = params.calendarId || "primary";

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: params.title,
        description: params.description,
        start: { dateTime: startDateTime, timeZone: "America/Fortaleza" },
        end: { dateTime: endDateTime, timeZone: "America/Fortaleza" },
        colorId: "10",
      }),
    }
  );

  if (!res.ok) {
    let error = `Google Calendar API ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) error = body.error.message;
    } catch {
      // ignore parse errors
    }
    console.error("[google-calendar] create event failed:", error);
    return { eventId: null, error };
  }
  const event = await res.json();
  return { eventId: event.id ?? null };
}

/** Atualiza título, descrição e horário de um evento existente */
export async function updateGoogleCalendarEventDetails(
  tokenData: Record<string, unknown>,
  params: {
    eventId: string;
    calendarId?: string;
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    colorId?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const tokens = await refreshAccessToken(tokenData as GoogleTokens);
  const calendarId = params.calendarId || "primary";
  const start = params.startTime.slice(0, 5);
  const end = params.endTime.slice(0, 5);

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: params.title,
        description: params.description,
        start: {
          dateTime: `${params.date}T${start}:00`,
          timeZone: "America/Fortaleza",
        },
        end: {
          dateTime: `${params.date}T${end}:00`,
          timeZone: "America/Fortaleza",
        },
        ...(params.colorId ? { colorId: params.colorId } : {}),
      }),
    }
  );

  if (!res.ok) {
    let error = `Google Calendar API ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) error = body.error.message;
    } catch {
      // ignore
    }
    console.error("[google-calendar] update event failed:", error);
    return { ok: false, error };
  }

  return { ok: true };
}

export function buildCalendarEventTitle(
  eventType: string,
  name: string,
  isFinalized = false
): string {
  const base = `${name} - ${eventType}`;
  return isFinalized ? `🏁 REALIZADO · ${base}` : base;
}

/** Remove prefixos legados do título exibido no CRM */
export function normalizeCalendarEventSummary(summary: string): string {
  return summary
    .replace(/^🏁 REALIZADO · /, "")
    .replace(/^✅ QUITADO · /, "")
    .trim();
}

/** Detecta pagamento quitado em eventos só do Google (cor, descrição ou título legado) */
export function isPaidGoogleCalendarEvent(g: {
  summary: string;
  description?: string;
  colorId?: string;
}): boolean {
  if (g.colorId === "2") return true;
  if (g.description?.includes("Pagamento: QUITADO")) return true;
  if (g.summary.includes("QUITADO")) return true;
  return false;
}

/** Extrai nome do cliente do título do Google Calendar */
export function extractClientNameFromSummary(summary: string): string | null {
  let s = summary
    .replace(/^✅ QUITADO · /, "")
    .replace(/^🏁 REALIZADO · /, "")
    .trim();

  const newFormatIdx = s.indexOf(" - ");
  if (newFormatIdx >= 0) {
    return s.slice(0, newFormatIdx).trim() || null;
  }

  s = s.replace(/^🎉 /, "");
  const legacyIdx = s.lastIndexOf(" — ");
  if (legacyIdx >= 0) return s.slice(legacyIdx + 3).trim();
  return s.trim() || null;
}

/** Atualiza título/cor do evento quando o lead é finalizado */
export async function updateGoogleCalendarFinalizedStatus(
  tokenData: Record<string, unknown>,
  params: {
    eventId: string;
    calendarId?: string;
    eventType: string;
    leadName: string;
    description?: string;
    isPaid?: boolean;
  }
): Promise<boolean> {
  const tokens = await refreshAccessToken(tokenData as GoogleTokens);
  const calendarId = params.calendarId || "primary";

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: buildCalendarEventTitle(
          params.eventType,
          params.leadName,
          true
        ),
        description: params.description,
        colorId: "8",
      }),
    }
  );

  return res.ok;
}

export function buildCalendarPaymentLine(
  received: number,
  total: number,
  isPaid: boolean
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  if (isPaid) {
    return `💰 Pagamento: QUITADO (${fmt(received)} de ${fmt(total)})`;
  }
  const remaining = Math.max(0, total - received);
  if (received > 0) {
    return `💰 Pagamento: parcial — recebido ${fmt(received)}, falta ${fmt(remaining)}`;
  }
  return `💰 Pagamento: a receber — total ${fmt(total)}`;
}

/** Atualiza título/cor/descrição do evento conforme status de pagamento */
export async function updateGoogleCalendarPaymentStatus(
  tokenData: Record<string, unknown>,
  params: {
    eventId: string;
    calendarId?: string;
    eventType: string;
    leadName: string;
    descriptionBase: string;
    total: number;
    received: number;
    isPaid: boolean;
  }
): Promise<boolean> {
  const tokens = await refreshAccessToken(tokenData as GoogleTokens);
  const calendarId = params.calendarId || "primary";

  const paymentLine = buildCalendarPaymentLine(
    params.received,
    params.total,
    params.isPaid
  );
  const description = [
    params.descriptionBase.replace(/\n💰 Pagamento:.*$/gm, "").trim(),
    paymentLine,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: buildCalendarEventTitle(
          params.eventType,
          params.leadName
        ),
        description,
        colorId: params.isPaid ? "2" : "10",
      }),
    }
  );

  return res.ok;
}

export type GoogleCalendarEventRow = {
  id: string;
  summary: string;
  description?: string;
  htmlLink?: string;
  colorId?: string;
  start: string;
  end: string;
  isAllDay: boolean;
};

export async function listGoogleCalendarEvents(
  tokenData: Record<string, unknown>,
  params: { timeMin: string; timeMax: string; calendarId?: string }
): Promise<GoogleCalendarEventRow[]> {
  const tokens = await refreshAccessToken(tokenData as GoogleTokens);
  const calendarId = params.calendarId || "primary";

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      }),
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map(
    (ev: {
      id: string;
      summary?: string;
      description?: string;
      htmlLink?: string;
      colorId?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }) => {
      const startRaw = ev.start?.dateTime || ev.start?.date || "";
      const endRaw = ev.end?.dateTime || ev.end?.date || "";
      const isAllDay = !ev.start?.dateTime;
      return {
        id: ev.id,
        summary: ev.summary ?? "Sem título",
        description: ev.description,
        htmlLink: ev.htmlLink,
        colorId: ev.colorId,
        start: startRaw,
        end: endRaw,
        isAllDay,
      };
    }
  );
}

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
