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
  const { error } = await supabase.rpc("upsert_rsvp", {
    p_submitter_name: data.submitter_name,
    p_email: data.email,
    p_phone: data.phone || null,
    p_attending: attending,
    p_party_size: partySize,
    p_guests: data.guests,
    p_side: data.side || null,
    p_message: data.message || null,
  });

  if (error) {
    console.error("RSVP upsert error:", error);
    return { success: false, error: "Failed to save your RSVP. Please try again." };
  }

  return { success: true };
}

export async function lookupRsvpByEmail(email: string): Promise<
  | { found: true; rsvp: { submitter_name: string; email: string; phone: string | null; guests: { name: string; attending: boolean; dietary: string }[]; side: string | null; message: string | null } }
  | { found: false }
> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) return { found: false };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_rsvp_by_email", {
    p_email: normalizedEmail,
  });

  if (error || !data || data.length === 0) return { found: false };

  const row = data[0];
  return {
    found: true,
    rsvp: {
      submitter_name: row.submitter_name,
      email: row.email,
      phone: row.phone ?? null,
      guests: (row.guests as { name: string; attending: boolean; dietary?: string }[]).map((g) => ({
        name: g.name,
        attending: g.attending,
        dietary: g.dietary ?? "",
      })),
      side: row.side ?? null,
      message: row.message ?? null,
    },
  };
}
