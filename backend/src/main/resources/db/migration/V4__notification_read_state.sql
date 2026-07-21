ALTER TABLE notification ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS ix_notification_user_read
    ON notification (user_id, read_at, created_at DESC) WHERE user_id IS NOT NULL;
