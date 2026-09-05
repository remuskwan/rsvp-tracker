-- Manual RSVP entry support (admin-added RSVPs).
-- NON-DESTRUCTIVE: only relaxes a column constraint and adds a defaulted column.
-- No existing rows are inserted, updated, or deleted.

-- Allow blank email for offline guests entered by an admin.
--
-- The existing `rsvps_email_unique` UNIQUE constraint (added in
-- 0002_rsvp_edit_support.sql) is intentionally LEFT IN PLACE. In Postgres a
-- UNIQUE constraint treats NULLs as distinct, so multiple emailless
-- (admin-entered) rows are allowed while real email addresses stay unique.
-- Keeping this NON-partial unique index also preserves the `upsert_rsvp`
-- function's `on conflict (email)` arbiter — a partial unique index would
-- break it with SQLSTATE 42P10 (no matching arbiter for ON CONFLICT).
alter table rsvps alter column email drop not null;

-- Distinguish admin-entered rows from guest self-submissions.
-- Existing rows default to 'guest'.
alter table rsvps add column source text not null default 'guest'
  check (source in ('guest', 'admin'));
