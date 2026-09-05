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
