"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { weddingInfoSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

async function fetchPlacePhoto(label: string, lat: number, lng: number): Promise<string | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  try {
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({
        textQuery: label,
        maxResultCount: 1,
        locationBias: {
          circle: { center: { latitude: lat, longitude: lng }, radius: 500 },
        },
      }),
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const photoName = searchData?.places?.[0]?.photos?.[0]?.name;
    if (!photoName) return null;

    const photoRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true&key=${key}`
    );
    if (!photoRes.ok) return null;
    const photoData = await photoRes.json();
    return photoData?.photoUri ?? null;
  } catch {
    return null;
  }
}

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

  const payload: typeof parsed.data & {
    venue_lat?: number | null;
    venue_lng?: number | null;
    venue_photo_url?: string | null;
    map_pins?: (typeof parsed.data.map_pins[number] & { photo_url?: string | null })[];
  } = { ...parsed.data };

  if (parsed.data.venue_address) {
    const coords = await geocodeAddress(parsed.data.venue_address);
    if (coords) {
      payload.venue_lat = coords.lat;
      payload.venue_lng = coords.lng;
      const photo = await fetchPlacePhoto(
        parsed.data.venue_name ?? parsed.data.venue_address,
        coords.lat,
        coords.lng
      );
      if (photo) payload.venue_photo_url = photo;
    }
  } else {
    payload.venue_lat = null;
    payload.venue_lng = null;
    payload.venue_photo_url = null;
  }

  if (parsed.data.map_pins.length > 0) {
    payload.map_pins = await Promise.all(
      parsed.data.map_pins.map(async (pin) => {
        const photo = await fetchPlacePhoto(pin.label, pin.lat, pin.lng);
        return { ...pin, photo_url: photo };
      })
    );
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
