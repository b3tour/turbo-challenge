-- Add terms_accepted_at column to users table
-- Tracks when user accepted the terms of service and privacy policy
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Backfill existing users: set terms_accepted_at to their created_at date
-- (they implicitly accepted by registering)
UPDATE users SET terms_accepted_at = created_at WHERE terms_accepted_at IS NULL;
