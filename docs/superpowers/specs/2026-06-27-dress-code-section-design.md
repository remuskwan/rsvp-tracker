# Replace "Logistics" admin section with an editable "Dress Code" section

**Date:** 2026-06-27
**Status:** Approved

## Problem

The admin "Logistics" section in `components/wedding-info-form.tsx` mixes live and
dead fields:

- **Dress Code** (`dress_code`) — shown as the "What to Wear" heading on the public page.
- **Accommodations** (`accommodations`) — quietly repurposed as the description
  paragraph under the dress code. Mislabeled.
- **Parking Information** (`parking_info`) — not rendered anywhere on the public site.
- **Google Maps Link** (`maps_url`) — not rendered on the public site (the map uses
  per-pin links instead).

The public "What to Wear" section (`app/page.tsx`) also shows four **hardcoded** color
swatches (Sage / Blush / Stone / Forest) that admins cannot edit.

## Goal

Remove the dead Logistics fields and replace the section with a focused, editable
**Dress Code** section that matches the existing public design: a heading, an additional
details paragraph, and admin-editable suggested colors.

## Decisions

- Suggested colors are **fully editable** (add/remove/edit), backed by a new JSON column.
- Parking Information and the standalone Google Maps Link inputs are **removed** from the
  admin form. Their DB columns remain (non-destructive) but go unused.
- Each swatch is `{ name, color }`. A subtle border is applied **automatically** to every
  swatch so dark colors stay visible on the dark background — no per-swatch toggle.

## Data model

New migration `supabase/migrations/0008_add_dress_colors.sql`:

```sql
alter table wedding_info
  add column if not exists dress_colors jsonb not null default
    '[{"name":"Sage","color":"#9caa86"},{"name":"Blush","color":"#e7cfc4"},{"name":"Stone","color":"#d8cead"},{"name":"Forest","color":"#3a5240"}]'::jsonb;

alter table wedding_info add column if not exists dress_code_details text;

-- Preserve current behavior: the accommodations text currently renders as the
-- dress-code description paragraph.
update wedding_info set dress_code_details = accommodations
  where dress_code_details is null and accommodations is not null;
```

`accommodations` and `parking_info` columns are left in place but become unused.

## Validation (`lib/validation.ts`)

Add to `weddingInfoSchema`:

```ts
dress_code_details: z.string().optional().nullable(),
dress_colors: z.array(z.object({
  name: z.string(),
  color: z.string(),
})).default([]),
```

`parking_info`, `accommodations`, and the top-level `maps_url` stay in the schema (so any
remaining data round-trips safely) but are no longer set from the Dress Code UI.

## Admin form (`components/wedding-info-form.tsx`)

Delete the `Logistics` section. Add a `Dress Code` section:

- **Dress Code** — text input (unchanged `dressCode` state / `dress_code`).
- **Additional Details** — textarea bound to new `dressCodeDetails` state / `dress_code_details`.
- **Suggested Colors** — editable list. Each row: native `<input type="color">` swatch +
  a name `<Input>` + a remove (trash) button. An "Add color" dashed button appends a new
  `{ name: "", color: "#cccccc" }` row. Mirrors the existing Map Pins / schedule editing
  patterns already in this file.

Remove the `parkingInfo` and section-level `mapsUrl` inputs and stop sending
`parking_info` / `maps_url` in the submit payload (drop the now-unused state if nothing
else references it). Add `dress_colors` and `dress_code_details` to the payload and to the
component's `initial` prop type.

## Public page (`app/page.tsx`)

- Read swatches from `wedding.dress_colors`; if empty/null, fall back to the existing
  four defaults (keep a `DEFAULT_DRESS_SWATCHES` const for the fallback).
- Apply the subtle border to every swatch automatically (`1px solid #5a6e54` or similar),
  replacing the per-swatch `border` flag.
- Read the description paragraph from `dress_code_details`, falling back to
  `accommodations` if details is empty (covers rows not touched by the migration).
- Markup, classes, and layout otherwise unchanged.

Update the `WeddingInfo` type and the wedding-info admin page loader
(`app/admin/(protected)/wedding-info/page.tsx`) to pass `dress_colors` and
`dress_code_details` into the form's `initial`.

## Out of scope

- Dropping the `accommodations` / `parking_info` columns (deferred; non-destructive).
- Any redesign of the public "What to Wear" visual treatment.

## Testing

- `npm run build` / typecheck passes.
- Manual: edit dress code text, details, add/remove a color in admin → save → verify the
  public page reflects all three. Empty colors falls back to the four defaults.
