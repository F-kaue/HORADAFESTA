-- Status finalizado + arquivamento de leads

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    'novo', 'em_conversa', 'aguardando', 'confirmado',
    'finalizado', 'nao_convertido'
  ));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON public.leads(archived_at);
CREATE INDEX IF NOT EXISTS idx_leads_finalized_at ON public.leads(finalized_at);
