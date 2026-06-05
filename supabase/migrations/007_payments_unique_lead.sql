-- Um plano por lead; remove duplicatas antigas (maybeSingle quebrava o GET)

DELETE FROM payments p
WHERE p.id NOT IN (
  SELECT DISTINCT ON (lead_id) id
  FROM payments
  ORDER BY lead_id, created_at DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_lead_id_unique ON payments(lead_id);
