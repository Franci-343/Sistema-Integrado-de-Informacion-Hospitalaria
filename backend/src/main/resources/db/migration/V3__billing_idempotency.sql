ALTER TABLE charge ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS ux_charge_idempotency
    ON charge (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_invoice_idempotency
    ON invoice (idempotency_key) WHERE idempotency_key IS NOT NULL;
