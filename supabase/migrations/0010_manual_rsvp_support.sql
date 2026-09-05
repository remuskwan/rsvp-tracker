-- Manual RSVP entry support (admin-added RSVPs).
-- NON-DESTRUCTIVE: only relaxes constraints and adds a defaulted column.
-- No existing rows are inserted, updated, or deleted.

-- Allow blank email for offline guests entered by an admin.
alter table rsvps alter column email drop not null;

-- Replace the plain unique constraint with a PARTIAL unique index, so multiple
-- emailless (NULL) rows are allowed while real emails remain unique.
-- (A NULL is never "equal" to another NULL, but excluding them via a partial
-- index makes the intent explicit and avoids surprises across PG versions.)
alter table rsvps drop constraint rsvps_email_unique;
create unique index rsvps_email_unique_idx on rsvps (email) where email is not null;

-- Distinguish admin-entered rows from guest self-submissions.
-- Existing rows default to 'guest'.
alter table rsvps add column source text not null default 'guest'
  check (source in ('guest', 'admin'));
