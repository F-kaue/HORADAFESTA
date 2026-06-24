-- Vincular despesas a clientes (leads) para resultado por evento

ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS accounts_payable_lead_id_idx ON public.accounts_payable(lead_id);
