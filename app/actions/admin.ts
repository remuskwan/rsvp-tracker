"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { weddingInfoSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function updateWeddingInfo(rawData: unknown) {
  await requireAdmin();

  const parsed = weddingInfoSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("wedding_info")
    .update(parsed.data)
    .eq("id", 1);

  if (error) {
    console.error("Wedding info update error:", error);
    return { success: false, error: "Failed to update. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin/wedding-info");
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
