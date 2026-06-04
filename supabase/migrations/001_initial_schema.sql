-- Hora da Festa CRM — Schema inicial

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT DEFAULT 'Hora da Festa Buffet e Eventos',
  phone TEXT,
  whatsapp TEXT NOT NULL DEFAULT '',
  google_calendar_token JSONB,
  max_events_per_day INTEGER DEFAULT 3,
  logo_url TEXT,
  morning_start TIME DEFAULT '08:00',
  morning_end TIME DEFAULT '12:00',
  afternoon_start TIME DEFAULT '12:00',
  afternoon_end TIME DEFAULT '18:00',
  evening_start TIME DEFAULT '18:00',
  evening_end TIME DEFAULT '23:59',
  working_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  blocked_dates DATE[] DEFAULT '{}',
  whatsapp_template TEXT,
  google_calendar_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  event_date DATE,
  slot_type TEXT CHECK (slot_type IN ('manha', 'tarde', 'noite', 'dia_todo')),
  event_start_time TIME,
  event_end_time TIME,
  location TEXT,
  neighborhood TEXT,
  guest_count INTEGER,
  event_type TEXT,
  observations TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'em_conversa', 'aguardando', 'confirmado', 'nao_convertido')),
  internal_notes TEXT,
  total_value DECIMAL(10,2),
  arrived_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  event_date DATE NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('manha', 'tarde', 'noite', 'dia_todo')),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'confirmado',
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_slots_date ON event_slots(event_date);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_user ON leads(user_id);

CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  installments INTEGER DEFAULT 1,
  installment_value DECIMAL(10,2),
  payment_type TEXT DEFAULT 'avista' CHECK (payment_type IN ('avista', 'parcelado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE,
  paid_date DATE,
  value DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_ip ON rate_limits(ip_address, created_at);

-- Disponibilidade de slots
CREATE OR REPLACE FUNCTION get_available_slots(check_date DATE, p_user_id UUID)
RETURNS TABLE(slot TEXT, available BOOLEAN) AS $$
DECLARE
  has_dia_todo BOOLEAN;
  has_manha BOOLEAN;
  has_tarde BOOLEAN;
  has_noite BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM event_slots WHERE event_date = check_date AND user_id = p_user_id AND slot_type = 'dia_todo' AND status = 'confirmado') INTO has_dia_todo;
  SELECT EXISTS(SELECT 1 FROM event_slots WHERE event_date = check_date AND user_id = p_user_id AND slot_type = 'manha' AND status = 'confirmado') INTO has_manha;
  SELECT EXISTS(SELECT 1 FROM event_slots WHERE event_date = check_date AND user_id = p_user_id AND slot_type = 'tarde' AND status = 'confirmado') INTO has_tarde;
  SELECT EXISTS(SELECT 1 FROM event_slots WHERE event_date = check_date AND user_id = p_user_id AND slot_type = 'noite' AND status = 'confirmado') INTO has_noite;

  RETURN QUERY SELECT 'manha'::TEXT, NOT (has_dia_todo OR has_manha);
  RETURN QUERY SELECT 'tarde'::TEXT, NOT (has_dia_todo OR has_tarde);
  RETURN QUERY SELECT 'noite'::TEXT, NOT (has_dia_todo OR has_noite);
  RETURN QUERY SELECT 'dia_todo'::TEXT, NOT (has_dia_todo OR has_manha OR has_tarde OR has_noite);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: histórico de status
CREATE OR REPLACE FUNCTION track_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO status_history (lead_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lead_status_change
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION track_lead_status_change();

-- Trigger: notificação de novo lead
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, lead_id)
  VALUES (
    NEW.user_id,
    'new_lead',
    'Novo lead',
    'Novo lead chegou: ' || NEW.name || COALESCE(' — evento para ' || TO_CHAR(NEW.event_date, 'DD/MM'), ''),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_lead
  AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION notify_new_lead();

-- Auto-criar profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, whatsapp)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuária'), '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);

-- Leads públicos inseridos via API com service_role (não expor insert anônimo)

CREATE POLICY "Users manage own event_slots" ON event_slots
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own payments" ON payments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own payment_records" ON payment_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM payments p WHERE p.id = payment_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Users view own status_history" ON status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_id AND l.user_id = auth.uid())
  );

CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Service role handles rate_limits via API

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
