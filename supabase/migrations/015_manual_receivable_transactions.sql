-- Extrato de recebimentos para recebíveis manuais

CREATE TABLE IF NOT EXISTS public.manual_receivable_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manual_receivable_id UUID NOT NULL REFERENCES public.manual_receivables(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  paid_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS manual_receivable_tx_receivable_idx
  ON public.manual_receivable_transactions(manual_receivable_id);

ALTER TABLE public.manual_receivable_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read manual receivable transactions"
  ON public.manual_receivable_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team manage manual receivable transactions"
  ON public.manual_receivable_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
