-- Editable "suggested colors" for the dress code section, plus a dedicated
-- details column. The accommodations text previously doubled as the dress-code
-- description paragraph, so back-fill it to preserve current display.

alter table wedding_info
  add column if not exists dress_colors jsonb not null default
    '[{"name":"Sage","color":"#9caa86"},{"name":"Blush","color":"#e7cfc4"},{"name":"Stone","color":"#d8cead"},{"name":"Forest","color":"#3a5240"}]'::jsonb;

alter table wedding_info add column if not exists dress_code_details text;

update wedding_info
  set dress_code_details = accommodations
  where dress_code_details is null and accommodations is not null;
