import Image from "next/image";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminNav } from "@/components/admin-nav";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  const meta = user.user_metadata as {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  } | undefined;

  const displayName = meta?.full_name ?? meta?.name ?? user.email ?? "Admin";
  const avatarUrl = meta?.avatar_url ?? null;
  const initials = getInitials(displayName);

  const profileFooter = (
    <div className="border-t border-stone-200 p-4 flex items-center gap-3 min-w-0">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={32}
          height={32}
          className="rounded-full object-cover shrink-0"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-stone-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{displayName}</p>
        <p className="text-xs text-stone-500 truncate">{user.email}</p>
      </div>
    </div>
  );

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  const nav = (
    <>
      <AdminNav />
      <div className="px-4 pb-2">
        <Separator className="mb-2" />
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 h-8 text-sm font-medium text-stone-500 hover:bg-stone-200/60 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <AdminShell nav={nav} footer={profileFooter}>
      {children}
    </AdminShell>
  );
}
