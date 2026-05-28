-- Normalize existing emails to lowercase
update rsvps set email = lower(email);

-- Enforce one RSVP per email address
alter table rsvps add constraint rsvps_email_unique unique (email);

-- Look up a guest's own RSVP by email.
-- SECURITY DEFINER bypasses RLS so anon can call this.
-- Only returns guest-editable columns — admin fields are never exposed.
create or replace function get_rsvp_by_email(p_email text)
returns table (
  submitter_name text,
  email         text,
  phone         text,
  guests        jsonb,
  side          text,
  message       text
)
security definer
set search_path = public
language sql
as $$
  select submitter_name, email, phone, guests, side, message
  from rsvps
  where email = lower(p_email)
  limit 1;
$$;

-- Insert or update a guest's RSVP by email.
-- SECURITY DEFINER bypasses RLS so anon can call this.
-- On conflict, only guest-editable columns are overwritten;
-- followup_status and admin_notes are left untouched.
create or replace function upsert_rsvp(
  p_submitter_name text,
  p_email          text,
  p_phone          text,
  p_attending      boolean,
  p_party_size     int,
  p_guests         jsonb,
  p_side           text,
  p_message        text
)
returns uuid
security definer
set search_path = public
language plpgsql
as $$
declare
  v_email text := lower(p_email);
  v_id    uuid;
begin
  insert into rsvps (submitter_name, email, phone, attending, party_size, guests, side, message)
  values (p_submitter_name, v_email, p_phone, p_attending, p_party_size, p_guests, p_side, p_message)
  on conflict (email) do update set
    submitter_name = excluded.submitter_name,
    phone          = excluded.phone,
    attending      = excluded.attending,
    party_size     = excluded.party_size,
    guests         = excluded.guests,
    side           = excluded.side,
    message        = excluded.message,
    updated_at     = now()
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function get_rsvp_by_email(text) to anon, authenticated;
grant execute on function upsert_rsvp(text, text, text, boolean, int, jsonb, text, text) to anon, authenticated;
