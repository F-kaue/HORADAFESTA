-- Recebíveis manuais (cadastro retroativo)

CREATE TABLE IF NOT EXISTS public.manual_receivables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  event_type TEXT,
  contract_total NUMERIC(12, 2) NOT NULL CHECK (contract_total > 0),
  received_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (received_total >= 0),
  received_date DATE,
  payment_method TEXT,
  notes TEXT,
  revenue_recognized_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS manual_receivables_event_date_idx ON public.manual_receivables(event_date);

ALTER TABLE public.manual_receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read manual receivables" ON public.manual_receivables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team manage manual receivables" ON public.manual_receivables
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
