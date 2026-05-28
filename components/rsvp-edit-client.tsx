"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RsvpForm } from "@/components/rsvp-form";
import { lookupRsvpByEmail } from "@/app/actions/rsvp";
import { Info } from "lucide-react";

interface GuestEntry {
  name: string;
  attending: boolean;
  dietary: string;
}

interface ExistingRsvp {
  email: string;
  phone: string | null;
  side: string | null;
  message: string | null;
  guests: GuestEntry[];
}

type State =
  | { step: "lookup" }
  | { step: "found"; rsvp: ExistingRsvp }
  | { step: "not_found" };

export function RsvpEditClient() {
  const [emailInput, setEmailInput] = useState("");
  const [state, setState] = useState<State>({ step: "lookup" });
  const [isPending, startTransition] = useTransition();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email) return;

    startTransition(async () => {
      const result = await lookupRsvpByEmail(email);
      if (result.found) {
        setState({ step: "found", rsvp: result.rsvp });
      } else {
        setState({ step: "not_found" });
      }
    });
  };

  if (state.step === "found") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-700">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Editing your RSVP for <strong>{state.rsvp.email}</strong>. Changes will overwrite your previous answers.</span>
        </div>
        <RsvpForm initial={state.rsvp} />
      </div>
    );
  }

  if (state.step === "not_found") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-700">
          We couldn&apos;t find an RSVP for <strong>{emailInput}</strong>.
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <Link href="/#rsvp" className="text-warm-600 hover:text-warm-900 underline underline-offset-2">
            RSVP for the first time →
          </Link>
          <button
            onClick={() => setState({ step: "lookup" })}
            className="text-warm-500 hover:text-warm-800 text-left"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleLookup} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="lookup-email">Email Address</Label>
        <Input
          id="lookup-email"
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
        />
        <p className="text-xs text-warm-400">Enter the email you used when you first RSVPed.</p>
      </div>
      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={isPending || !emailInput.trim()}
      >
        {isPending ? "Looking up…" : "Find my RSVP"}
      </Button>
    </form>
  );
}
