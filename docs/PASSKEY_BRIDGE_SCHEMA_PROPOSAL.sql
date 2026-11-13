-- AILAT DATA Firebase Passkey Bridge — PROPOSAL ONLY
-- Do NOT run against production until the WebAuthn library, Firebase Admin
-- custom-token signer, origin/RP-ID, recovery, and endpoint review are complete.
-- Account sign-in only. Never use these credentials for wallet/payment approval.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.passkey_credentials (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  firebase_uid text NOT NULL CHECK (length(firebase_uid) BETWEEN 1 AND 128),
  credential_id text NOT NULL UNIQUE CHECK (length(credential_id) BETWEEN 16 AND 2048),
  public_key bytea NOT NULL CHECK (octet_length(public_key) BETWEEN 32 AND 8192),
  sign_count bigint NOT NULL DEFAULT 0 CHECK (sign_count >= 0),
  transports text[] NOT NULL DEFAULT '{}',
  backup_eligible boolean NOT NULL DEFAULT false,
  backup_state boolean NOT NULL DEFAULT false,
  display_name text CHECK (display_name IS NULL OR length(display_name) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS passkey_credentials_uid_active_idx
  ON private.passkey_credentials (firebase_uid, created_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS private.passkey_challenges (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  challenge_hash bytea NOT NULL UNIQUE CHECK (octet_length(challenge_hash) = 32),
  ceremony text NOT NULL CHECK (ceremony IN ('registration', 'authentication')),
  firebase_uid text CHECK (firebase_uid IS NULL OR length(firebase_uid) BETWEEN 1 AND 128),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS passkey_challenges_expiry_idx
  ON private.passkey_challenges (expires_at);

-- Browser roles must never read or mutate passkey credentials or challenges.
ALTER TABLE private.passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.passkey_challenges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.passkey_credentials FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.passkey_challenges FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE private.passkey_credentials TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE private.passkey_challenges TO service_role;
GRANT USAGE, SELECT ON SEQUENCE private.passkey_credentials_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE private.passkey_challenges_id_seq TO service_role;

-- No browser-facing RLS policies are intentionally created.
-- The Edge Function must use the service role only after its own strict
-- Firebase/WebAuthn checks. Consume challenges atomically:
--
-- UPDATE private.passkey_challenges
-- SET consumed_at = now()
-- WHERE challenge_hash = $1
--   AND ceremony = $2
--   AND (firebase_uid IS NOT DISTINCT FROM $3)
--   AND consumed_at IS NULL
--   AND expires_at > now()
-- RETURNING id;
--
-- The endpoint must require exactly one returned row. Zero rows means expired,
-- mismatched, missing, or replayed challenge and must fail closed.
--
-- Cleanup expired challenges periodically; never log raw challenge values,
-- credential private material, Firebase Admin credentials, or authenticator
-- response payloads.
