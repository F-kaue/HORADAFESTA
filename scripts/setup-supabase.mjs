/**
 * Setup Supabase — Hora da Festa CRM
 * Requer SUPABASE_DB_PASSWORD no .env.local (Settings → Database no Supabase)
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌ .env.local não encontrado");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
}

const env = loadEnv();
const PROJECT_REF = "ukwutenjacrfwicxwcuf";
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = env.SUPABASE_DB_PASSWORD;

async function applyMigration() {
  if (!DB_PASSWORD) {
    console.log("⚠️  SUPABASE_DB_PASSWORD não definido — pule migration automática.");
    console.log("   Cole o SQL em: supabase/migrations/001_initial_schema.sql");
    console.log("   No SQL Editor: https://supabase.com/dashboard/project/" + PROJECT_REF + "/sql/new");
    return false;
  }

  const hosts = [
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  ];

  const sql = readFileSync(
    join(root, "supabase/migrations/001_initial_schema.sql"),
    "utf8"
  );

  for (const connectionString of hosts) {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log("📦 Aplicando migration...");
      await client.query(sql);
      await client.end();
      console.log("✅ Migration aplicada com sucesso!");
      return true;
    } catch (e) {
      try {
        await client.end();
      } catch {}
      console.log(`   Tentativa falhou (${connectionString.split("@")[1]?.slice(0, 30)}...): ${e.message}`);
    }
  }
  return false;
}

async function ensureAdminUser() {
  const email = env.ADMIN_EMAIL || "dona@horadafesta.com.br";
  const password = env.ADMIN_PASSWORD || "HoraDaFesta2026!";

  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Dona Hora da Festa" },
    }),
  });

  if (res.ok) {
    const user = await res.json();
    console.log("✅ Usuária criada:", email);
    console.log("   UUID (OWNER_USER_ID):", user.id);
    return user.id;
  }

  const listRes = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=50`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  const { users } = await listRes.json();
  const existing = users?.find((u) => u.email === email);
  if (existing) {
    console.log("ℹ️  Usuária já existe:", email);
    console.log("   UUID (OWNER_USER_ID):", existing.id);
    return existing.id;
  }

  const err = await res.text();
  console.error("❌ Erro ao criar usuária:", err);
  return null;
}

async function updateProfile(userId) {
  const whatsapp = env.DEFAULT_WHATSAPP || "5585999999999";
  const res = await fetch(
    `${URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: "Dona Hora da Festa",
        business_name: "Hora da Festa Buffet e Eventos",
        whatsapp,
      }),
    }
  );
  if (res.ok) console.log("✅ Perfil atualizado (whatsapp:", whatsapp + ")");
  else if (res.status === 404) console.log("⚠️  Tabela profiles ainda não existe — rode a migration primeiro");
  else console.log("⚠️  Perfil:", await res.text());
}

async function main() {
  console.log("\n🎉 Setup Hora da Festa CRM — Supabase\n");
  const migrated = await applyMigration();
  const userId = await ensureAdminUser();
  if (migrated && userId) await updateProfile(userId);
  if (userId) {
    console.log("\n📋 Adicione ao .env.local:");
    console.log(`OWNER_USER_ID=${userId}`);
    console.log(`ADMIN_EMAIL=${env.ADMIN_EMAIL || "dona@horadafesta.com.br"}`);
    console.log(`ADMIN_PASSWORD=${env.ADMIN_PASSWORD || "HoraDaFesta2026!"}`);
  }
  console.log("\n");
}

main().catch(console.error);
