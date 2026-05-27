-- Wedding Info table (singleton, id must be 1)
create table wedding_info (
  id int primary key check (id = 1),
  couple_names text not null default 'The Happy Couple',
  event_date timestamptz,
  venue_name text,
  venue_address text,
  ceremony_time text,
  reception_time text,
  dress_code text,
  parking_info text,
  accommodations text,
  sections jsonb not null default '[]'::jsonb,
  rsvp_deadline date,
  updated_at timestamptz not null default now()
);

-- Insert the singleton row
insert into wedding_info (id) values (1);

-- RSVPs table
create table rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitter_name text not null,
  email text not null,
  phone text,
  attending boolean not null,
  party_size int not null default 1,
  guests jsonb not null default '[]'::jsonb,
  side text check (side in ('bride', 'groom', 'both')),
  message text,
  followup_status text not null default 'new' check (followup_status in ('new', 'contacted', 'confirmed', 'no_response')),
  admin_notes text
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger rsvps_updated_at
  before update on rsvps
  for each row execute function update_updated_at();

create trigger wedding_info_updated_at
  before update on wedding_info
  for each row execute function update_updated_at();

-- Enable RLS
alter table wedding_info enable row level security;
alter table rsvps enable row level security;

-- wedding_info: anyone can read
create policy "Public can read wedding_info"
  on wedding_info for select
  to anon, authenticated
  using (true);

-- wedding_info: only authenticated users with matching admin email can update
create policy "Admin can update wedding_info"
  on wedding_info for update
  to authenticated
  using (auth.jwt() ->> 'email' = current_setting('app.admin_email', true))
  with check (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- rsvps: anyone can insert (guests submitting RSVPs)
create policy "Public can insert rsvps"
  on rsvps for insert
  to anon, authenticated
  with check (true);

-- rsvps: only admin can read
create policy "Admin can read rsvps"
  on rsvps for select
  to authenticated
  using (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- rsvps: only admin can update
create policy "Admin can update rsvps"
  on rsvps for update
  to authenticated
  using (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- rsvps: only admin can delete
create policy "Admin can delete rsvps"
  on rsvps for delete
  to authenticated
  using (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));
