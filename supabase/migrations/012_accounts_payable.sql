-- Contas a pagar e CNPJ no perfil

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cnpj TEXT;

CREATE TABLE IF NOT EXISTS public.accounts_payable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  supplier TEXT,
  category TEXT NOT NULL DEFAULT 'Outro',
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  holder TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accounts_payable_due_date_idx ON public.accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS accounts_payable_status_idx ON public.accounts_payable(status);

ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read accounts payable" ON public.accounts_payable
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team manage accounts payable" ON public.accounts_payable
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
