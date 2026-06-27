import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { WeddingInfoForm } from "@/components/wedding-info-form";

export const revalidate = 0;

export default async function WeddingInfoPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: info } = await supabase
    .from("wedding_info")
    .select("*")
    .eq("id", 1)
    .single();

  // Seed the schedule editor from the new column, falling back to the legacy
  // ceremony/reception time fields so existing data migrates in on first load.
  const legacySchedule = [
    info?.ceremony_time && { time: info.ceremony_time, title: "Ceremony", detail: "" },
    info?.reception_time && { time: info.reception_time, title: "Reception", detail: "" },
  ].filter(Boolean) as { time: string; title: string; detail: string }[];

  const schedule =
    Array.isArray(info?.schedule) && info.schedule.length > 0
      ? info.schedule
      : legacySchedule;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">
          Edit Wedding Info
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Changes will appear on the public wedding page immediately.
        </p>
      </div>
      <WeddingInfoForm
        initial={{
          couple_names: info?.couple_names ?? "",
          event_date: info?.event_date ?? null,
          venue_name: info?.venue_name ?? null,
          venue_address: info?.venue_address ?? null,
          schedule,
          dress_code: info?.dress_code ?? null,
          parking_info: info?.parking_info ?? null,
          accommodations: info?.accommodations ?? null,
          maps_url: info?.maps_url ?? null,
          map_pins: info?.map_pins ?? [],
          how_to_get_there: info?.how_to_get_there ?? null,
          venue_photo_url: info?.venue_photo_url ?? null,
          sections: info?.sections ?? [],
          faqs: info?.faqs ?? [],
          rsvp_deadline: info?.rsvp_deadline ?? null,
        }}
      />
    </div>
  );
}
