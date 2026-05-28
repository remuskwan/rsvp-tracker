"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestRow } from "@/components/guest-row";
import { submitRsvp } from "@/app/actions/rsvp";
import { PlusCircle } from "lucide-react";

interface GuestEntry {
  name: string;
  attending: boolean;
  dietary: string;
}

const defaultGuest = (): GuestEntry => ({
  name: "",
  attending: true,
  dietary: "",
});

export function RsvpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [side, setSide] = useState<string>("");
  const [message, setMessage] = useState("");
  const [guests, setGuests] = useState<GuestEntry[]>([defaultGuest()]);

  const updateGuest = (
    index: number,
    field: "name" | "attending" | "dietary",
    value: string | boolean
  ) => {
    setGuests((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  };

  const addGuest = () => setGuests((prev) => [...prev, defaultGuest()]);

  const removeGuest = (index: number) =>
    setGuests((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const submitterName = guests[0]?.name?.trim();
    if (!submitterName) {
      toast.error("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    for (let i = 0; i < guests.length; i++) {
      if (!guests[i].name.trim()) {
        toast.error(`Please enter a name for Guest ${i + 1}.`);
        return;
      }
    }

    startTransition(async () => {
      const result = await submitRsvp({
        submitter_name: submitterName,
        email: email.trim(),
        phone: phone.trim() || undefined,
        guests: guests.map((g) => ({
          name: g.name.trim(),
          attending: g.attending,
          dietary: g.dietary.trim(),
        })),
        side: (side as "bride" | "groom" | "both") || undefined,
        message: message.trim() || undefined,
      });

      if (result.success) {
        router.push("/rsvp/submitted");
      } else {
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact info */}
      <section className="space-y-4">
        <h3
          className="text-lg text-warm-700"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Your Contact Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+65 91234567"
            />
          </div>
        </div>
      </section>

      {/* Guests */}
      <section className="space-y-4">
        <h3
          className="text-lg text-warm-700"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Who&apos;s Attending?
        </h3>
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
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addGuest}
          className="w-full border-dashed"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add another guest
        </Button>
      </section>

      {/* Optional extras */}
      <section className="space-y-4">
        <h3
          className="text-lg text-warm-700"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          A Little More
        </h3>
        <div className="space-y-1">
          <Label htmlFor="side">How do you know the couple?</Label>
          <Select value={side} onValueChange={(v) => setSide(v ?? "")}>
            <SelectTrigger id="side">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bride">Bride&apos;s side</SelectItem>
              <SelectItem value="groom">Groom&apos;s side</SelectItem>
              <SelectItem value="both">Both!</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="message">Message to the couple (optional)</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something lovely…"
            rows={4}
          />
        </div>
      </section>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-full text-base"
        disabled={isPending}
      >
        {isPending ? "Sending…" : "Send My RSVP"}
      </Button>
    </form>
  );
}
