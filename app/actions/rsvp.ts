"use server";

import { createClient } from "@/lib/supabase/server";
import { rsvpSchema } from "@/lib/validation";

export async function submitRsvp(rawData: unknown) {
  const parsed = rsvpSchema.safeParse(rawData);
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
    email: data.email,
    phone: data.phone || null,
    attending,
    party_size: partySize,
    guests: data.guests,
    side: data.side || null,
    message: data.message || null,
  });

  if (error) {
    console.error("RSVP insert error:", error);
    return { success: false, error: "Failed to save your RSVP. Please try again." };
  }

  return { success: true };
}
