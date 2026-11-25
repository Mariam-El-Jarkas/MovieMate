-- Lets an email-change code remember which new email it is for.
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS new_email text;
