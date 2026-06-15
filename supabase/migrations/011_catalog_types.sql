-- Tipos de evento e tipos de serviço configuráveis

CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  duration_hours NUMERIC(4, 2) NOT NULL DEFAULT 3,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS service_type TEXT;

INSERT INTO public.event_types (name, sort_order) VALUES
  ('Aniversário', 1),
  ('Casamento', 2),
  ('Formatura', 3),
  ('Corporativo', 4),
  ('Batizado', 5),
  ('Outro', 99)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.service_types (name, duration_hours, sort_order) VALUES
  ('Barraquinhas', 3, 1),
  ('Buffet', 5, 2),
  ('Coffee break', 2, 3),
  ('Decoração', 4, 4)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read event types" ON public.event_types
  FOR SELECT USING (active = TRUE);

CREATE POLICY "Team manage event types" ON public.event_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read service types" ON public.service_types
  FOR SELECT USING (active = TRUE);

CREATE POLICY "Team manage service types" ON public.service_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
