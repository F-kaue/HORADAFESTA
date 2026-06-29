import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // ignore
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CALENDAR_USER_ID =
  process.env.CALENDAR_SYNC_USER_ID || "1502a641-7a28-44af-a058-6e73d3fa91e7";

async function refreshAccessToken(tokens) {
  if (tokens.access_token && tokens.expiry_date && tokens.expiry_date > Date.now()) {
    return tokens;
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
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

function buildTitle(eventType, name, isFinalized) {
  const base = `${name} - ${eventType}`;
  return isFinalized ? `🏁 REALIZADO · ${base}` : base;
}

function buildDescription(lead) {
  const fmt = (t) => (t ? String(t).slice(0, 5) : "");
  const schedule =
    fmt(lead.event_start_time) && fmt(lead.event_end_time)
      ? `${fmt(lead.event_start_time)} – ${fmt(lead.event_end_time)}`
      : fmt(lead.event_start_time) || "";
  return [
    `Cliente: ${lead.name}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Local: ${lead.location} - ${lead.neighborhood}`,
    `Convidados: ~${lead.guest_count}`,
    `Tipo: ${lead.event_type}`,
    lead.service_type ? `Serviço: ${lead.service_type}` : "",
    schedule ? `Horário: ${schedule}` : "",
    lead.observations ? `Obs: ${lead.observations}` : "",
    lead.internal_notes ? `Notas: ${lead.internal_notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_calendar_token, google_calendar_id")
    .eq("id", CALENDAR_USER_ID)
    .single();

  if (!profile?.google_calendar_token) {
    console.error("Sem token Google Calendar no perfil", CALENDAR_USER_ID);
    process.exit(1);
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .in("status", ["confirmado", "finalizado"])
    .not("event_date", "is", null);

  const tokens = await refreshAccessToken(profile.google_calendar_token);
  const calendarId = profile.google_calendar_id || "primary";
  let ok = 0;
  let fail = 0;

  for (const lead of leads ?? []) {
    if (!lead.google_event_id) {
      console.log(`SKIP (sem evento): ${lead.name}`);
      continue;
    }

    const start = lead.event_start_time?.slice(0, 5) ?? "13:00";
    const end = lead.event_end_time?.slice(0, 5) ?? "16:00";
    const title = buildTitle(
      lead.event_type ?? "Evento",
      lead.name,
      lead.status === "finalizado"
    );

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(lead.google_event_id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: title,
          description: buildDescription(lead),
          start: {
            dateTime: `${lead.event_date}T${start}:00`,
            timeZone: "America/Fortaleza",
          },
          end: {
            dateTime: `${lead.event_date}T${end}:00`,
            timeZone: "America/Fortaleza",
          },
        }),
      }
    );

    if (res.ok) {
      console.log(`OK: ${title}`);
      ok++;
    } else {
      const err = await res.text();
      console.error(`FAIL: ${lead.name}`, err);
      fail++;
    }
  }

  console.log(`\nConcluído: ${ok} atualizado(s), ${fail} falha(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
