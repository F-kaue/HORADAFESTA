# Setup Supabase — Hora da Festa

**Projeto:** `ukwutenjacrfwicxwcuf`  
**URL:** https://ukwutenjacrfwicxwcuf.supabase.co

## ✅ Já configurado automaticamente

| Item | Status |
|------|--------|
| `.env.local` com chaves anon + service_role | ✅ |
| `OWNER_USER_ID` | ✅ `bfea014e-dd92-4be3-a7d6-ffad85eab9bc` |
| Usuária admin criada | ✅ |
| Login CRM | `dona@horadafesta.com.br` / `HoraDaFesta2026!` |

## ✅ Migration aplicada (via MCP)

Tabelas criadas com RLS, triggers, Realtime e perfil da dona inserido.

**Atualize o WhatsApp real** em Configurações no CRM ou:

```sql
UPDATE profiles SET whatsapp = '55SEU_NUMERO' WHERE id = 'bfea014e-dd92-4be3-a7d6-ffad85eab9bc';
```

## MCP Supabase no Cursor

O MCP está ligado a **outra conta** (não lista o projeto "Hora da Festa").  
As chaves que você passou **funcionam** neste projeto — só o MCP não consegue aplicar migrations.

Para corrigir: em Cursor → MCP → Supabase, reconecte com a conta onde está o projeto `ukwutenjacrfwicxwcuf`.

## Segurança

As chaves `service_role` e `anon` foram expostas no chat. Após subir o sistema, em  
**Settings → API → Regenerate keys** no Supabase e atualize o `.env.local`.

## Testar

**Produção:** https://horadafesta.vercel.app  
**Local:** `npm run dev` → http://localhost:3000

- Login: `/login`  
- Formulário público: `/orcamento`  
