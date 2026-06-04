-- Permite o trigger de mudança de status gravar histórico (RLS bloqueava UPDATE em leads)

CREATE POLICY "Team insert status_history" ON public.status_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- Garante insert mesmo se políticas mudarem no futuro
CREATE OR REPLACE FUNCTION public.track_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.status_history (lead_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
