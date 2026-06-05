-- Recebimentos parciais (ex: R$ 500 no dia X) com rateio nas parcelas

CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  paid_date DATE NOT NULL,
  notes TEXT,
  allocations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_payment ON payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(paid_date);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team read payment_transactions" ON payment_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team insert payment_transactions" ON payment_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team delete payment_transactions" ON payment_transactions
  FOR DELETE TO authenticated USING (true);
