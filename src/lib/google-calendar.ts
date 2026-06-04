import { SLOT_TIMES, type SlotType } from "./slots";

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
    slotType: SlotType;
    startTime?: string;
    endTime?: string;
    calendarId?: string;
  }
): Promise<string | null> {
  const tokens = await refreshAccessToken(tokenData as GoogleTokens);
  const times = SLOT_TIMES[params.slotType];
  const start = params.startTime || times.start;
  const end = params.endTime || times.end;

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

  if (!res.ok) return null;
  const event = await res.json();
  return event.id ?? null;
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
