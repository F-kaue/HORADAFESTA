-- CRM compartilhado: todas as contas autenticadas veem e gerenciam os mesmos leads

-- LEADS
DROP POLICY IF EXISTS "Users manage own leads" ON public.leads;

CREATE POLICY "Team read all leads" ON public.leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team insert leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team update all leads" ON public.leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Team delete all leads" ON public.leads
  FOR DELETE TO authenticated USING (true);

-- EVENT_SLOTS
DROP POLICY IF EXISTS "Users manage own event_slots" ON public.event_slots;

CREATE POLICY "Team read all event_slots" ON public.event_slots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team manage event_slots" ON public.event_slots
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team update event_slots" ON public.event_slots
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Team delete event_slots" ON public.event_slots
  FOR DELETE TO authenticated USING (true);

-- PAYMENTS
DROP POLICY IF EXISTS "Users manage own payments" ON public.payments;

CREATE POLICY "Team read all payments" ON public.payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team insert payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team update payments" ON public.payments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Team delete payments" ON public.payments
  FOR DELETE TO authenticated USING (true);

-- PAYMENT_RECORDS
DROP POLICY IF EXISTS "Users manage own payment_records" ON public.payment_records;

CREATE POLICY "Team read payment_records" ON public.payment_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team insert payment_records" ON public.payment_records
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team update payment_records" ON public.payment_records
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Team delete payment_records" ON public.payment_records
  FOR DELETE TO authenticated USING (true);

-- STATUS_HISTORY
DROP POLICY IF EXISTS "Users view own status_history" ON public.status_history;

CREATE POLICY "Team read status_history" ON public.status_history
  FOR SELECT TO authenticated USING (true);

-- NOTIFICATIONS (cada usuário vê as suas; trigger envia para todos)
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;

CREATE POLICY "Team read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Team update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notificar TODAS as contas quando chegar lead
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, lead_id)
  SELECT
    p.id,
    'new_lead',
    'Novo lead',
    'Novo lead chegou: ' || NEW.name || COALESCE(' — evento para ' || TO_CHAR(NEW.event_date, 'DD/MM'), ''),
    NEW.id
  FROM public.profiles p;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Disponibilidade considerando TODOS os eventos confirmados (todas as contas)
CREATE OR REPLACE FUNCTION public.get_available_slots_shared(check_date DATE)
RETURNS TABLE(slot TEXT, available BOOLEAN) AS $$
DECLARE
  has_dia_todo BOOLEAN;
  has_manha BOOLEAN;
  has_tarde BOOLEAN;
  has_noite BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.event_slots
    WHERE event_date = check_date AND slot_type = 'dia_todo' AND status = 'confirmado'
  ) INTO has_dia_todo;
  SELECT EXISTS(
    SELECT 1 FROM public.event_slots
    WHERE event_date = check_date AND slot_type = 'manha' AND status = 'confirmado'
  ) INTO has_manha;
  SELECT EXISTS(
    SELECT 1 FROM public.event_slots
    WHERE event_date = check_date AND slot_type = 'tarde' AND status = 'confirmado'
  ) INTO has_tarde;
  SELECT EXISTS(
    SELECT 1 FROM public.event_slots
    WHERE event_date = check_date AND slot_type = 'noite' AND status = 'confirmado'
  ) INTO has_noite;

  RETURN QUERY SELECT 'manha'::TEXT, NOT (has_dia_todo OR has_manha);
  RETURN QUERY SELECT 'tarde'::TEXT, NOT (has_dia_todo OR has_tarde);
  RETURN QUERY SELECT 'noite'::TEXT, NOT (has_dia_todo OR has_noite);
  RETURN QUERY SELECT 'dia_todo'::TEXT, NOT (has_dia_todo OR has_manha OR has_tarde OR has_noite);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
