# Hora da Festa CRM

CRM completo para buffet e eventos — captação de leads, kanban, agenda com slots, Google Calendar, financeiro e dashboard.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + componentes estilo shadcn
- **Supabase** (PostgreSQL, Auth, Realtime)
- **Google Calendar API** (OAuth2)
- **Vercel** (deploy)

## Configuração

### 1. Supabase

O projeto **`ukwutenjacrfwicxwcuf`** já está ligado no `.env.local`.

**Falta só rodar a migration** — veja `SETUP-SUPABASE.md` (SQL Editor ou `npm run setup:supabase`).

**Login da dona (já criado):**
- E-mail: `dona@horadafesta.com.br`
- Senha: `HoraDaFesta2026!` *(troque após o primeiro acesso)*

### 2. Variáveis de ambiente

O arquivo `.env.local` já está preenchido. Para novo ambiente:

```bash
cp .env.local.example .env.local
```

### 3. Google Calendar (opcional)

1. [Google Cloud Console](https://console.cloud.google.com) → OAuth 2.0
2. Redirect URI: `{NEXT_PUBLIC_APP_URL}/api/google/callback`
3. Preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`

### 4. Rodar localmente

```bash
npm install
npm run dev
```

- CRM: http://localhost:3000/login
- Formulário público: http://localhost:3000/orcamento

## Deploy (Vercel)

1. Importe o repositório na Vercel
2. Configure as variáveis de ambiente (mesmas do `.env.local`)
3. `NEXT_PUBLIC_APP_URL` = URL de produção

## Módulos

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação (acesso único) |
| `/orcamento` | Formulário público + WhatsApp |
| `/dashboard` | Métricas, agenda da semana, gráficos |
| `/leads` | Kanban com drag & drop |
| `/financeiro` | Gráficos, parcelas, export CSV |
| `/configuracoes` | Perfil, disponibilidade, Google, QR Code |

## Paleta

- Primary: `#E8612C`
- Secondary: `#1A1A2E`
- Accent: `#F9C846`
- Surface: `#FFF8F3`

---

Desenvolvido para **Hora da Festa Buffet & Eventos**
