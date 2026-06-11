-- Integração WhatsApp (Evolution API)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_instance_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_connection_status TEXT DEFAULT 'disconnected'
    CHECK (whatsapp_connection_status IN ('disconnected', 'connecting', 'connected'));

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remote_jid TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  contact_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_conversations_updated ON public.whatsapp_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_phone ON public.whatsapp_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_lead ON public.whatsapp_conversations(lead_id);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE,
  remote_jid TEXT NOT NULL,
  from_me BOOLEAN NOT NULL DEFAULT FALSE,
  body TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation ON public.whatsapp_messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_messages_external ON public.whatsapp_messages(external_id);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read whatsapp conversations" ON public.whatsapp_conversations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team insert whatsapp conversations" ON public.whatsapp_conversations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team update whatsapp conversations" ON public.whatsapp_conversations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Team read whatsapp messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team insert whatsapp messages" ON public.whatsapp_messages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team update whatsapp messages" ON public.whatsapp_messages
  FOR UPDATE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
