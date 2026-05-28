import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { AdminsClient } from "./admins-client";

export default async function AdminsPage() {
  const currentUser = await requireAdmin();
  const supabase = await createClient();

  const { data: admins, error } = await supabase
    .from("admins")
    .select("email, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-destructive">Failed to load admins: {error.message}</p>
      </div>
    );
  }

  return (
    <AdminsClient
      admins={admins ?? []}
      currentUserEmail={currentUser.email!}
    />
  );
}
