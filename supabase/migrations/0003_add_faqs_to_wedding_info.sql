alter table wedding_info add column if not exists faqs jsonb not null default '[]'::jsonb;
