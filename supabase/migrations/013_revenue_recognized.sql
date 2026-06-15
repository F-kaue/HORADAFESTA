-- Liberação manual de receita retida

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS revenue_recognized_at TIMESTAMPTZ;
