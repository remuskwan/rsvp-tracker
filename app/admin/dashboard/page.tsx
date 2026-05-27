import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { RsvpsTable } from "@/components/rsvps-table";

export const revalidate = 0; // always fresh

export default async function DashboardPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: rsvps, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">Failed to load RSVPs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">RSVPs</h1>
        <p className="text-sm text-stone-500 mt-1">
          Track responses and follow up with guests
        </p>
      </div>
      <RsvpsTable rsvps={rsvps ?? []} />
    </div>
  );
}
