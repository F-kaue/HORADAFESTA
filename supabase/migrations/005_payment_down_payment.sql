-- Entrada + parcelas com identificação por tipo

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS down_payment DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE payment_records
  ADD COLUMN IF NOT EXISTS record_kind TEXT NOT NULL DEFAULT 'parcela'
    CHECK (record_kind IN ('entrada', 'parcela'));
