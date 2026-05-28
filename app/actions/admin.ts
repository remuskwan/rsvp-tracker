"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { weddingInfoSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  try {
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(address)}&limit=1&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const [lng, lat] = data?.features?.[0]?.geometry?.coordinates ?? [];
    if (lng == null || lat == null) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function updateWeddingInfo(rawData: unknown) {
  await requireAdmin();

  const parsed = weddingInfoSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const payload: typeof parsed.data & { venue_lat?: number | null; venue_lng?: number | null } = { ...parsed.data };

  if (parsed.data.venue_address) {
    const coords = await geocodeAddress(parsed.data.venue_address);
    if (coords) {
      payload.venue_lat = coords.lat;
      payload.venue_lng = coords.lng;
    }
  } else {
    payload.venue_lat = null;
    payload.venue_lng = null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("wedding_info")
    .update(payload)
    .eq("id", 1);

  if (error) {
    console.error("Wedding info update error:", error);
    return { success: false, error: "Failed to update. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin/wedding-info");
  return { success: true };
}

export async function addAdmin(email: string) {
  await requireAdmin();

  const normalised = email.trim().toLowerCase();
  if (!normalised || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    return { success: false, error: "Invalid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("admins")
    .insert({ email: normalised });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That email is already an admin." };
    }
    return { success: false, error: "Failed to add admin." };
  }

  revalidatePath("/admin/admins");
  return { success: true };
}

export async function removeAdmin(email: string) {
  const currentUser = await requireAdmin();

  if (currentUser.email === email) {
    return { success: false, error: "You cannot remove yourself." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("admins")
    .delete()
    .eq("email", email);

  if (error) {
    return { success: false, error: "Failed to remove admin." };
  }

  revalidatePath("/admin/admins");
  return { success: true };
}

export async function updateRsvpStatus(
  id: string,
  followup_status: string,
  admin_notes: string
) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("rsvps")
    .update({ followup_status, admin_notes })
    .eq("id", id);

  if (error) {
    console.error("RSVP status update error:", error);
    return { success: false, error: "Failed to update." };
  }

  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deleteRsvp(id: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("rsvps").delete().eq("id", id);

  if (error) {
    console.error("RSVP delete error:", error);
    return { success: false, error: "Failed to delete." };
  }

  revalidatePath("/admin/dashboard");
  return { success: true };
}
