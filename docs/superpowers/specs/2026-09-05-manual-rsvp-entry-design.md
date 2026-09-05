# Manual RSVP Entry for Admins — Design

**Date:** 2026-09-05
**Status:** Approved

## Problem

Some guests never fill in the public RSVP form (they reply in person, by phone, or
over chat). Admins currently have no way to record those responses, so the
dashboard and CSV export under-count the real guest list. We need a way for an
admin to enter an RSVP manually.

## Constraints from the existing data model

- `rsvps.email` is currently `not null` and carries a `rsvps_email_unique`
  constraint. Offline guests often have no email on record, so manual entry must
  tolerate a blank email.
- The public flow (`app/actions/rsvp.ts` → `upsert_rsvp` RPC) is email-keyed and
  cannot represent a null email, so manual entry needs its own insert path.
- **Migrations must not delete or mutate existing rows.** All schema changes here
  are additive or constraint-relaxing only.

## Decisions

1. **Email is optional for manual entries.** Relax the DB constraint rather than
   requiring a real email or generating a fake one.
2. **UI is a dialog on the dashboard** ("Add RSVP" button above the table), not a
   separate page.
3. **Manual entries are flagged** via a `source` column so they can be told apart
   from guest self-submissions in the table.

## Changes

### 1. Migration — `supabase/migrations/0010_manual_rsvp_support.sql`

Non-destructive. No `insert`, `update`, or `delete` of existing data.

```sql
-- Allow blank email for offline guests entered by an admin
alter table rsvps alter column email drop not null;

-- Replace the plain unique constraint with a partial unique index so that
-- multiple emailless (NULL) rows are allowed, while real emails stay unique.
alter table rsvps drop constraint rsvps_email_unique;
create unique index rsvps_email_unique_idx on rsvps (email) where email is not null;

-- Distinguish admin-entered rows from guest self-submissions.
-- Existing rows default to 'guest'.
alter table rsvps add column source text not null default 'guest'
  check (source in ('guest', 'admin'));
```

Note: dropping the `not null` and the unique *constraint* and adding a defaulted
column are all data-preserving. Existing rows keep their email and gain
`source = 'guest'`.

### 2. Validation — `lib/validation.ts`

Add an admin-specific schema. Email becomes optional; a blank string normalises to
`undefined` so the action can store `NULL`.

```ts
export const adminRsvpSchema = z.object({
  submitter_name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email or leave it blank')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: z.string().optional().default(''),
  guests: z.array(guestSchema).min(1, 'Add at least one guest'),
  side: z.enum(['bride', 'groom', 'both']).optional(),
  message: z.string().optional().default(''),
  followup_status: z
    .enum(['new', 'contacted', 'confirmed', 'no_response'])
    .default('confirmed'),
})

export type AdminRsvpFormData = z.infer<typeof adminRsvpSchema>
```

(Exact Zod composition for "valid email OR blank" to be finalised during
implementation; behaviour required: non-empty must be a valid email, empty is
allowed and becomes `NULL`.)

### 3. Server action — `app/actions/admin.ts`

```ts
export async function createManualRsvp(rawData: unknown) {
  await requireAdmin();

  const parsed = adminRsvpSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const data = parsed.data;
  const attendingGuests = data.guests.filter(g => g.attending);
  const partySize = attendingGuests.length;
  const attending = partySize > 0;

  const supabase = await createClient();
  const { error } = await supabase.from('rsvps').insert({
    submitter_name: data.submitter_name,
    email: data.email ?? null,
    phone: data.phone || null,
    attending,
    party_size: partySize,
    guests: data.guests,
    side: data.side ?? null,
    message: data.message || null,
    followup_status: data.followup_status,
    source: 'admin',
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'An RSVP with that email already exists.' };
    }
    console.error('Manual RSVP insert error:', error);
    return { success: false, error: 'Failed to add RSVP. Please try again.' };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}
```

Party-size / attending derivation mirrors `submitRsvp` so a "regrets" entry (all
guests marked not attending → `attending = false`, `party_size = 0`) is
representable.

### 4. UI

- **`components/ui/dialog.tsx`** — add a Base UI `Dialog` primitive
  (`@base-ui/react/dialog`), styled to match the existing `alert-dialog.tsx`.
  Only `alert-dialog` exists today and it is semantically wrong for a form.
- **`components/add-rsvp-dialog.tsx`** — client component. Renders an "Add RSVP"
  trigger button and a dialog form:
  - Submitter name (required), email (optional), phone (optional)
  - Repeatable guest rows: name / attending toggle / dietary — add & remove rows
  - Side (select), message (textarea), status (select, default Confirmed)
  - Submits via `createManualRsvp`; on success shows a toast, resets, closes, and
    calls `router.refresh()` to reload the server-rendered table.
- **`components/rsvps-table.tsx`**:
  - Render `<AddRsvpDialog />` in the filters/actions row (near Export CSV).
  - Extend the `Rsvp` interface with `source?: string`.
  - Show a small **"Manual"** badge next to the submitter name when
    `source === 'admin'`.

## Data flow

```
Admin → AddRsvpDialog (client) → createManualRsvp server action
  → requireAdmin → adminRsvpSchema → supabase.insert(source:'admin')
  → revalidatePath('/admin/dashboard')
Client → router.refresh() → dashboard server component re-queries → table re-renders
```

## Error handling

- Invalid form input → Zod messages surfaced in a toast.
- Duplicate email (`23505`) → friendly message; row not created.
- Any other DB error → logged server-side, generic failure message to the admin.

## Testing

- `lib/validation.ts`: `adminRsvpSchema` accepts blank email (→ undefined),
  rejects malformed non-empty email, requires ≥1 guest, defaults status to
  `confirmed`.
- `createManualRsvp`: unauthenticated → rejected by `requireAdmin`; happy path
  inserts with `source:'admin'` and derived party size; duplicate email returns
  the friendly error. (Follows the mocking pattern in
  `__tests__/actions/admin.test.ts`.)
- Party-size derivation: all-not-attending guests → `attending:false`,
  `party_size:0`.

## Out of scope (YAGNI)

- Bulk / CSV import of manual RSVPs.
- Editing an existing RSVP's guest list from the table (already not supported).
- Notifying the guest of the manually-entered RSVP.
