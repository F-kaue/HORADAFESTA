-- Contratos de prestação de serviços

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Contrato padrão',
  body TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho', 'enviado', 'assinado', 'cancelado')),
  contratante_name TEXT,
  contratante_cpf TEXT,
  contratante_phone TEXT,
  event_address TEXT,
  event_date DATE,
  event_time TEXT,
  package_description TEXT,
  contract_value NUMERIC(12, 2),
  body_override TEXT,
  signature_city TEXT DEFAULT 'Fortaleza/CE',
  signature_day TEXT,
  signature_month TEXT,
  signature_year TEXT,
  signed_file_path TEXT,
  signed_file_name TEXT,
  signed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contracts_lead_id_idx ON public.contracts(lead_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx ON public.contracts(status);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read contract templates" ON public.contract_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team manage contract templates" ON public.contract_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Team read contracts" ON public.contracts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team manage contracts" ON public.contracts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-documents', 'contract-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth upload contract documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-documents');

CREATE POLICY "Auth read contract documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contract-documents');

CREATE POLICY "Auth update contract documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contract-documents');

CREATE POLICY "Auth delete contract documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contract-documents');
