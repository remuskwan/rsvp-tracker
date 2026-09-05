# Manual RSVP Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin manually record RSVPs (with an optional email) for guests who never filled in the public form, flagged as admin-entered on the dashboard.

**Architecture:** A non-destructive migration relaxes the `rsvps.email` constraint and adds a `source` column. A new `adminRsvpSchema` and a `createManualRsvp` server action provide the insert path (distinct from the email-keyed public `upsert_rsvp` RPC). A dashboard dialog collects the entry; the row shows a "Manual" badge when `source === 'admin'`.

**Tech Stack:** Next.js (App Router, server actions), Supabase (Postgres + RLS), Zod, Base UI (`@base-ui/react`), Tailwind, Vitest.

## Global Constraints

- **Read `node_modules/next/dist/docs/` before writing Next.js code** — this repo's Next.js has breaking changes vs. training data (per AGENTS.md).
- **Migrations must not delete or mutate existing rows** — additive / constraint-relaxing SQL only. No `insert`/`update`/`delete` of existing data.
- Emails are stored lowercased; a blank email is stored as SQL `NULL`.
- Follow existing patterns: server actions in `app/actions/admin.ts` guard with `requireAdmin()`; tests use the `vi.hoisted` mock pattern already in `__tests__/actions/admin.test.ts`.
- Commands: tests `npm test`, lint `npm run lint`, build `npm run build`.

---

### Task 1: Non-destructive migration

**Files:**
- Create: `supabase/migrations/0010_manual_rsvp_support.sql`

**Interfaces:**
- Consumes: existing `rsvps` table (`email text not null`, constraint `rsvps_email_unique`) from `0001_init.sql` / `0002_rsvp_edit_support.sql`.
- Produces: `rsvps.email` nullable; partial unique index `rsvps_email_unique_idx` on `email where email is not null`; new column `rsvps.source text not null default 'guest' check (source in ('guest','admin'))`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0010_manual_rsvp_support.sql`:

```sql
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
```

- [ ] **Step 2: Sanity-check against existing schema**

Confirm the constraint name is correct (it is defined in `0002_rsvp_edit_support.sql` as `rsvps_email_unique`) and that no other migration already adds a `source` column:

Run: `grep -rn "rsvps_email_unique\|add column source\|alter column email" supabase/migrations/`
Expected: the constraint appears in `0002` (added) and `0010` (dropped); `source`/`alter column email` appear only in `0010`.

- [ ] **Step 3: Apply the migration locally (if Supabase CLI + local DB available)**

Run: `supabase migration up` (or `supabase db reset` to replay all migrations from scratch)
Expected: applies cleanly with no error. If the Supabase CLI/local stack is not available in this environment, skip application here — the migration runs on deploy — but Step 2 must still pass.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0010_manual_rsvp_support.sql
git commit -m "feat: migration for optional email + source column on rsvps"
```

---

### Task 2: `adminRsvpSchema` validation

**Files:**
- Modify: `lib/validation.ts`
- Test: `__tests__/validation.test.ts`

**Interfaces:**
- Consumes: existing `guestSchema` from `lib/validation.ts`.
- Produces: `adminRsvpSchema` (Zod) and `AdminRsvpFormData` type. Parsed shape:
  `{ submitter_name: string; email?: string; phone: string; guests: {name,attending,dietary}[]; side?: 'bride'|'groom'|'both'; message: string; followup_status: 'new'|'contacted'|'confirmed'|'no_response' }`.
  `email` is `undefined` when blank/omitted, otherwise a lowercased valid email. `followup_status` defaults to `'confirmed'`.

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/validation.test.ts` (extend the import on line 2 to include `adminRsvpSchema`):

```ts
// import line becomes:
// import { guestSchema, rsvpSchema, weddingInfoSchema, adminRsvpSchema } from '../lib/validation'

describe('adminRsvpSchema', () => {
  const base = {
    submitter_name: 'Alice',
    guests: [{ name: 'Alice', attending: true }],
  }

  it('accepts an entry with no email', () => {
    const result = adminRsvpSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBeUndefined()
  })

  it('treats a blank email as undefined', () => {
    const result = adminRsvpSchema.safeParse({ ...base, email: '   ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBeUndefined()
  })

  it('lowercases and trims a provided email', () => {
    const result = adminRsvpSchema.safeParse({ ...base, email: '  ALICE@EXAMPLE.COM ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('alice@example.com')
  })

  it('rejects a malformed non-empty email', () => {
    expect(adminRsvpSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false)
  })

  it('requires at least one guest', () => {
    expect(adminRsvpSchema.safeParse({ ...base, guests: [] }).success).toBe(false)
  })

  it('requires a submitter_name', () => {
    expect(adminRsvpSchema.safeParse({ ...base, submitter_name: '' }).success).toBe(false)
  })

  it('defaults followup_status to confirmed', () => {
    const result = adminRsvpSchema.safeParse(base)
    if (result.success) expect(result.data.followup_status).toBe('confirmed')
  })

  it('accepts an explicit followup_status', () => {
    const result = adminRsvpSchema.safeParse({ ...base, followup_status: 'new' })
    if (result.success) expect(result.data.followup_status).toBe('new')
  })

  it('rejects an unknown followup_status', () => {
    expect(adminRsvpSchema.safeParse({ ...base, followup_status: 'maybe' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- validation`
Expected: FAIL — `adminRsvpSchema` is `undefined` / not exported.

- [ ] **Step 3: Implement the schema**

Append to `lib/validation.ts` (after the existing `rsvpSchema` block, reusing `guestSchema`):

```ts
export const adminRsvpSchema = z.object({
  submitter_name: z.string().min(1, 'Name is required'),
  email: z
    .preprocess(
      (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
      z.union([
        z.literal(''),
        z.string().email('Enter a valid email or leave it blank'),
      ]),
    )
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
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

Note on the email field: `z.preprocess` trims + lowercases first, then the union accepts either `''` or a valid email; the `transform` maps `''` to `undefined`; `.optional()` (outermost) lets the key be omitted entirely. This gives "valid email OR blank, blank ⇒ undefined".

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- validation`
Expected: PASS (all `adminRsvpSchema` tests plus the pre-existing ones).

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts __tests__/validation.test.ts
git commit -m "feat: adminRsvpSchema for manual RSVP entry (optional email)"
```

---

### Task 3: `createManualRsvp` server action

**Files:**
- Modify: `app/actions/admin.ts`
- Test: `__tests__/actions/admin.test.ts`

**Interfaces:**
- Consumes: `requireAdmin()` (`@/lib/supabase/admin-guard`), `createClient()` (`@/lib/supabase/server`), `adminRsvpSchema` (Task 2), `revalidatePath`.
- Produces: `async function createManualRsvp(rawData: unknown): Promise<{ success: true } | { success: false; error: string }>`. Inserts into `rsvps` with `source: 'admin'`; derives `attending`/`party_size` from the guest list; maps Postgres `23505` to a friendly duplicate-email error; revalidates `/admin/dashboard`.

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/actions/admin.test.ts`. Extend the import on line 21 to include `createManualRsvp`, then add:

```ts
describe('createManualRsvp', () => {
  const validEntry = {
    submitter_name: 'Carol',
    guests: [
      { name: 'Carol', attending: true },
      { name: 'Dave', attending: true },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ email: 'admin@example.com' })
  })

  it('propagates auth rejection when requireAdmin throws', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('NEXT_REDIRECT:/admin/login'))
    await expect(createManualRsvp(validEntry)).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns a validation error for invalid data', async () => {
    const result = await createManualRsvp({ submitter_name: '', guests: [] })
    expect(result.success).toBe(false)
  })

  it('inserts with source admin and derived party size, then revalidates', async () => {
    const chain = makeChain()
    const result = await createManualRsvp(validEntry)
    expect(result).toEqual({ success: true })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'admin',
        attending: true,
        party_size: 2,
        email: null,
        followup_status: 'confirmed',
      }),
    )
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('records a regrets entry as not attending with party size 0', async () => {
    const chain = makeChain()
    await createManualRsvp({
      submitter_name: 'Eve',
      guests: [{ name: 'Eve', attending: false }],
    })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ attending: false, party_size: 0 }),
    )
  })

  it('maps a duplicate email (23505) to a friendly error', async () => {
    makeChain({ error: { code: '23505' } })
    const result = await createManualRsvp({ ...validEntry, email: 'dup@example.com' })
    expect(result).toEqual({
      success: false,
      error: 'An RSVP with that email already exists.',
    })
  })

  it('returns a generic error for other database failures', async () => {
    makeChain({ error: { code: 'XXXXX', message: 'boom' } })
    const result = await createManualRsvp(validEntry)
    expect(result).toEqual({ success: false, error: 'Failed to add RSVP. Please try again.' })
  })
})
```

Note: the existing `makeChain` helper (lines 23-34) already makes `chain.insert` a terminal mock resolving to `{ error }`, so `.from('rsvps').insert(...)` returns `{ error }` directly — matching the action below.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- admin`
Expected: FAIL — `createManualRsvp` is not exported.

- [ ] **Step 3: Implement the action**

In `app/actions/admin.ts`, add `adminRsvpSchema` to the import from `@/lib/validation` (currently imports `weddingInfoSchema`), then append:

```ts
export async function createManualRsvp(rawData: unknown) {
  await requireAdmin();

  const parsed = adminRsvpSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const data = parsed.data;
  const attendingGuests = data.guests.filter((g) => g.attending);
  const partySize = attendingGuests.length;
  const attending = partySize > 0;

  const supabase = await createClient();
  const { error } = await supabase.from("rsvps").insert({
    submitter_name: data.submitter_name,
    email: data.email ?? null,
    phone: data.phone || null,
    attending,
    party_size: partySize,
    guests: data.guests,
    side: data.side ?? null,
    message: data.message || null,
    followup_status: data.followup_status,
    source: "admin",
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "An RSVP with that email already exists." };
    }
    console.error("Manual RSVP insert error:", error);
    return { success: false, error: "Failed to add RSVP. Please try again." };
  }

  revalidatePath("/admin/dashboard");
  return { success: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- admin`
Expected: PASS (all `createManualRsvp` tests plus the pre-existing admin-action tests).

- [ ] **Step 5: Commit**

```bash
git add app/actions/admin.ts __tests__/actions/admin.test.ts
git commit -m "feat: createManualRsvp server action for admin-entered RSVPs"
```

---

### Task 4: Base UI `Dialog` primitive

**Files:**
- Create: `components/ui/dialog.tsx`

**Interfaces:**
- Consumes: `@base-ui/react/dialog`, `cn` from `@/lib/utils`.
- Produces: exports `Dialog`, `DialogTrigger`, `DialogClose`, `DialogPortal`, `DialogBackdrop`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` — same surface as `alert-dialog.tsx` but on the `Dialog` primitive (dismissable, appropriate for forms).

- [ ] **Step 1: Create the primitive**

Create `components/ui/dialog.tsx`, mirroring `components/ui/alert-dialog.tsx` but importing the `Dialog` primitive. Give the content a slightly wider max width and vertical scroll for the form:

```tsx
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close
const DialogPortal = DialogPrimitive.Portal

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border border-stone-200 bg-background p-6 shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="dialog-header" className={cn("flex flex-col gap-2 text-left", className)} {...props} />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base font-semibold text-stone-900", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-stone-500", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
```

- [ ] **Step 2: Typecheck the primitive**

Run: `npx tsc --noEmit`
Expected: no errors. If the `@base-ui/react/dialog` sub-path or a `*.Props` type name differs from what's assumed, correct it to match the installed `@base-ui/react` API (compare against `components/ui/alert-dialog.tsx`, which is known-good, and the Base UI Dialog docs). Re-run until clean.

- [ ] **Step 3: Commit**

```bash
git add components/ui/dialog.tsx
git commit -m "feat: add Base UI Dialog primitive"
```

---

### Task 5: Add-RSVP dialog + dashboard wiring + "Manual" badge

**Files:**
- Create: `components/add-rsvp-dialog.tsx`
- Modify: `components/rsvps-table.tsx`

**Interfaces:**
- Consumes: `createManualRsvp` (Task 3), `Dialog*` primitives (Task 4), existing `GuestRow` (`@/components/guest-row`), `Button`, `Input`, `Label`, `Select*`, `Textarea`, `toast`, `useRouter`, `useTransition`.
- Produces: `export function AddRsvpDialog()` — a self-contained trigger + dialog form. `RsvpsTable` renders it in the actions row and shows a `Badge` reading "Manual" next to the name when `rsvp.source === 'admin'`.

- [ ] **Step 1: Create the AddRsvpDialog component**

Create `components/add-rsvp-dialog.tsx`. It reuses `GuestRow` for the repeatable guest list and mirrors the state/derivation shape of `components/rsvp-form.tsx`, but submits via `createManualRsvp` and closes the dialog on success:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle, UserPlus } from "lucide-react";

import { createManualRsvp } from "@/app/actions/admin";
import { GuestRow } from "@/components/guest-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface GuestEntry {
  name: string;
  attending: boolean;
  dietary: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "no_response", label: "No Response" },
];

const defaultGuest = (): GuestEntry => ({ name: "", attending: true, dietary: "" });

export function AddRsvpDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [side, setSide] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [guests, setGuests] = useState<GuestEntry[]>([defaultGuest()]);

  const reset = () => {
    setEmail("");
    setPhone("");
    setSide("");
    setMessage("");
    setStatus("confirmed");
    setGuests([defaultGuest()]);
  };

  const updateGuest = (
    index: number,
    field: "name" | "attending" | "dietary",
    value: string | boolean,
  ) => {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };
  const addGuest = () => setGuests((prev) => [...prev, defaultGuest()]);
  const removeGuest = (index: number) =>
    setGuests((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const submitterName = guests[0]?.name?.trim();
    if (!submitterName) {
      toast.error("Please enter the guest's name.");
      return;
    }
    for (let i = 0; i < guests.length; i++) {
      if (!guests[i].name.trim()) {
        toast.error(`Please enter a name for Guest ${i + 1}.`);
        return;
      }
    }

    startTransition(async () => {
      const result = await createManualRsvp({
        submitter_name: submitterName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        guests: guests.map((g) => ({
          name: g.name.trim(),
          attending: g.attending,
          dietary: g.dietary.trim(),
        })),
        side: (side as "bride" | "groom" | "both") || undefined,
        message: message.trim() || undefined,
        followup_status: status,
      });

      if (result.success) {
        toast.success(`Added RSVP for ${submitterName}`);
        reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2" />
        }
      >
        <UserPlus className="h-4 w-4" />
        Add RSVP
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an RSVP</DialogTitle>
          <DialogDescription>
            Manually record a response for a guest who didn&apos;t fill in the form.
            Email is optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="manual-email">Email (optional)</Label>
              <Input
                id="manual-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-phone">Phone (optional)</Label>
              <Input
                id="manual-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+65 91234567"
              />
            </div>
          </div>

          <div className="space-y-3">
            {guests.map((guest, index) => (
              <GuestRow
                key={index}
                index={index}
                isFirst={index === 0}
                name={guest.name}
                attending={guest.attending}
                dietary={guest.dietary}
                onChange={(field, value) => updateGuest(index, field, value)}
                onRemove={index > 0 ? () => removeGuest(index) : undefined}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addGuest}
              className="w-full border-dashed"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add another guest
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="manual-side">Side (optional)</Label>
              <Select value={side} onValueChange={(v) => setSide(v ?? "")}>
                <SelectTrigger id="manual-side">
                  <SelectValue placeholder="Select one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">Bride&apos;s side</SelectItem>
                  <SelectItem value="groom">Groom&apos;s side</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "confirmed")}>
                <SelectTrigger id="manual-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="manual-message">Message (optional)</Label>
            <Textarea
              id="manual-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any note from the guest…"
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add RSVP"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

Note: `DialogTrigger`/`DialogClose` use the Base UI `render={<Button .../>}` prop pattern already used by `AlertDialogTrigger` in `components/rsvps-table.tsx` (lines 196-208). If Base UI's `Dialog.Root` uses a prop other than `open`/`onOpenChange` for controlled state, align it with the installed API (verify against the Base UI Dialog docs) — the rest of the component is unaffected.

- [ ] **Step 2: Wire the dialog into the table and add the "Manual" badge**

In `components/rsvps-table.tsx`:

1. Add to the imports:

```tsx
import { AddRsvpDialog } from "@/components/add-rsvp-dialog";
```

2. Extend the `Rsvp` interface (after line 63, inside the interface) with:

```tsx
  source?: string;
```

3. In `RsvpRow`, show a "Manual" badge next to the name. Replace the name `<span>` (currently line 134) inside the expand button with:

```tsx
            <span className="font-medium">{rsvp.submitter_name}</span>
            {rsvp.source === "admin" && (
              <Badge variant="secondary" className="ml-1 text-[10px] uppercase tracking-wide">
                Manual
              </Badge>
            )}
```

4. In the actions row of `RsvpsTable`, render the dialog just before the Export CSV link (immediately before the `<a href="/api/rsvps/export">` block, currently line 435):

```tsx
        <AddRsvpDialog />
```

- [ ] **Step 3: Typecheck, lint, and run the full test suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint errors, all tests pass.

- [ ] **Step 4: Manual verification (dev server)**

Run: `npm run dev`, then as a logged-in admin open `/admin/dashboard`. Verify:
- An "Add RSVP" button appears near "Export CSV".
- Clicking it opens the dialog; adding two attending guests and submitting with **no email** succeeds, the dialog closes, and a new row appears with attending "Yes (2)" and a "Manual" badge.
- Adding a second entry with an email already used by an existing RSVP shows "An RSVP with that email already exists."
- An entry with the single guest marked "No" appears as not attending.

- [ ] **Step 5: Commit**

```bash
git add components/add-rsvp-dialog.tsx components/rsvps-table.tsx
git commit -m "feat: admin dialog to add RSVPs manually + Manual badge"
```

---

## Self-Review

**Spec coverage:**
- Migration (optional email, partial unique index, `source` column, non-destructive) → Task 1. ✓
- `adminRsvpSchema` (optional email, ≥1 guest, default status) → Task 2. ✓
- `createManualRsvp` (requireAdmin, derive party size, `source:'admin'`, 23505 handling, revalidate) → Task 3. ✓
- Base UI Dialog primitive → Task 4. ✓
- Add-RSVP dialog + table wiring + "Manual" badge → Task 5. ✓
- Data flow (dialog → action → insert → `router.refresh()`) → Task 5 Step 1/2. ✓
- Error handling (Zod messages, duplicate email, generic failure) → Tasks 2, 3, 5. ✓
- Testing (validation, action, party-size derivation) → Tasks 2, 3. ✓
- Out-of-scope items (bulk import, guest-list editing, guest notification) → not implemented. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code and exact commands. ✓

**Type consistency:** `createManualRsvp`, `adminRsvpSchema`, `AdminRsvpFormData`, and the `Dialog*` export names are used identically across Tasks 2-5. The action's insert keys (`source`, `followup_status`, `party_size`, `email`) match the migration columns and the test assertions in Task 3. ✓
