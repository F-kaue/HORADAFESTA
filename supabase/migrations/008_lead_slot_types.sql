-- Vários turnos por evento + disponibilidade ignorando o próprio lead na confirmação
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS slot_types TEXT[];

UPDATE public.leads
SET slot_types = ARRAY[slot_type::TEXT]
WHERE slot_type IS NOT NULL AND (slot_types IS NULL OR cardinality(slot_types) = 0);

CREATE OR REPLACE FUNCTION public.get_available_slots_shared(
  check_date DATE,
  exclude_lead_id UUID DEFAULT NULL
)
RETURNS TABLE(slot TEXT, available BOOLEAN) AS $$
DECLARE
  has_dia_todo BOOLEAN;
  has_manha BOOLEAN;
  has_tarde BOOLEAN;
  has_noite BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.event_slots
    WHERE event_date = check_date
      AND slot_type = 'dia_todo'
      AND status = 'confirmado'
      AND (exclude_lead_id IS NULL OR lead_id IS DISTINCT FROM exclude_lead_id)
  ) INTO has_dia_todo;
  SELECT EXISTS(
    SELECT 1 FROM public.event_slots
    WHERE event_date = check_date
      AND slot_type = 'manha'
      AND status = 'confirmado'
      AND (exclude_lead_id IS NULL OR lead_id IS DISTINCT FROM exclude_lead_id)
  ) INTO has_manha;
  SELECT EXISTS(
    SELECT 1 FROM public.event_slots
    WHERE event_date = check_date
      AND slot_type = 'tarde'
      AND status = 'confirmado'
      AND (exclude_lead_id IS NULL OR lead_id IS DISTINCT FROM exclude_lead_id)
  ) INTO has_tarde;
  SELECT EXISTS(
    SELECT 1 FROM public.event_slots
    WHERE event_date = check_date
      AND slot_type = 'noite'
      AND status = 'confirmado'
      AND (exclude_lead_id IS NULL OR lead_id IS DISTINCT FROM exclude_lead_id)
  ) INTO has_noite;

  RETURN QUERY SELECT 'manha'::TEXT, NOT (has_dia_todo OR has_manha);
  RETURN QUERY SELECT 'tarde'::TEXT, NOT (has_dia_todo OR has_tarde);
  RETURN QUERY SELECT 'noite'::TEXT, NOT (has_dia_todo OR has_noite);
  RETURN QUERY SELECT 'dia_todo'::TEXT, NOT (has_dia_todo OR has_manha OR has_tarde OR has_noite);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
