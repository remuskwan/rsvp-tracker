alter table wedding_info add column if not exists schedule jsonb not null default '[]'::jsonb;
