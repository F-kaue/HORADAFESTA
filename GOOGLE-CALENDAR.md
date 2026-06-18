# Conectar Google Agenda — Hora da Festa CRM

O erro **"OAuth client was not found" (401 invalid_client)** significa que o CRM ainda **não tem** `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` configurados na Vercel (ou estão incorretos).

---

## Passo 1 — Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto (ou use um existente), ex: **Hora da Festa**
3. Menu **APIs e serviços** → **Biblioteca**
4. Busque **Google Calendar API** → **Ativar**

---

## Passo 2 — Tela de consentimento OAuth

1. **APIs e serviços** → **Tela de consentimento OAuth**
2. Tipo: **Externo** (ou Interno se for Workspace da empresa)
3. Preencha:
   - Nome do app: `Hora da Festa CRM`
   - E-mail de suporte: seu e-mail
   - Domínio autorizado (opcional): `horadafesta.vercel.app`
4. **Escopos** → Adicionar escopo:
   - `https://www.googleapis.com/auth/calendar`
5. **Usuários de teste** (enquanto o app estiver em "Teste"):
   - Adicione **todos** os Gmail que vão conectar a agenda, ex:
     - `f_kaue@hotmail.com`
     - `horadafestace@gmail.com`
6. Salvar

> **Tela "O Google não verificou este app"**  
> Enquanto o app não passar pela verificação do Google, essa tela aparece para todo mundo.  
> O usuário deve clicar em **Avançado** → **Ir para Hora da Festa CRM (não seguro)**.  
> Para remover a tela de vez, é preciso publicar o app e solicitar verificação OAuth no Google Cloud (processo demorado).

---

## Passo 3 — Credenciais OAuth (o mais importante)

1. **APIs e serviços** → **Credenciais**
2. **+ Criar credenciais** → **ID do cliente OAuth**
3. Tipo: **Aplicativo da Web**
4. Nome: `Hora da Festa CRM`

**URIs de redirecionamento autorizados** — cole exatamente:

```
https://horadafesta.vercel.app/api/google/callback
http://localhost:3000/api/google/callback
```

5. **Criar**
6. Copie:
   - **ID do cliente** → `GOOGLE_CLIENT_ID`
   - **Chave secreta do cliente** → `GOOGLE_CLIENT_SECRET`

---

## Passo 4 — Colocar na Vercel

1. https://vercel.com/f-kaues-projects/horadafesta/settings/environment-variables
2. Adicione (ambiente **Production** e **Preview**):

| Variável | Valor |
|----------|--------|
| `GOOGLE_CLIENT_ID` | ID do cliente (termina em `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Chave secreta |

3. Confirme que existe:
   - `NEXT_PUBLIC_APP_URL` = `https://horadafesta.vercel.app`

4. **Redeploy** (Deployments → ⋮ no último deploy → Redeploy)  
   Ou rode no projeto: `powershell -File scripts/push-vercel-env.ps1` e push no Git.

---

## Passo 5 — Local (opcional)

No `.env.local`:

```env
GOOGLE_CLIENT_ID=seu-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=sua-chave-secreta
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Passo 6 — Conectar no CRM

1. Login: https://horadafesta.vercel.app/login
2. **Configurações** → **Conectar Google Calendar**
3. Escolha a conta Google da agenda do buffet
4. Autorize o acesso ao Calendar
5. Deve voltar com `?google=connected` e status **✅ Conectado**

---

## Checklist se ainda der erro

- [ ] Calendar API está **ativada** no projeto Google
- [ ] Redirect URI **igual** ao da Vercel (sem barra extra no final)
- [ ] `GOOGLE_CLIENT_ID` na Vercel **sem espaços** no início/fim
- [ ] Fez **Redeploy** depois de salvar as variáveis
- [ ] Se app em modo **Teste**, seu Gmail está em **Usuários de teste**
- [ ] Usar a mesma conta Google que tem a agenda principal

---

## O que o CRM faz depois de conectado

- Lê eventos da agenda para bloquear datas no formulário `/orcamento`
- Cria evento no Google Calendar ao **confirmar** um lead pela aba **Confirmação** do card (não ao arrastar para a coluna Confirmado)
- Em **Configurações**, use **Sincronizar eventos pendentes** para criar eventos de leads já confirmados que ficaram sem agenda

Fuso horário dos eventos: `America/Fortaleza`
