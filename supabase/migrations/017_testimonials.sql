-- Depoimentos para o site institucional (uso futuro)

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  event_type TEXT,
  city TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read testimonials" ON public.testimonials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team manage testimonials" ON public.testimonials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read published testimonials" ON public.testimonials
  FOR SELECT TO anon USING (is_published = true);
