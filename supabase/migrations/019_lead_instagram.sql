-- Instagram do cliente vinculado ao lead
-- Guarda apenas o @usuario (sem a URL). Opcional.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS instagram TEXT;
