import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/configuracoes?google=error`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    return NextResponse.redirect(`${appUrl}/configuracoes?google=error`);
  }

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      google_calendar_token: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: Date.now() + tokens.expires_in * 1000,
      },
    })
    .eq("id", state);

  return NextResponse.redirect(`${appUrl}/configuracoes?google=connected`);
}
