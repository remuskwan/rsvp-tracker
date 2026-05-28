import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Edit, QrCode, LogOut, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";

async function AdminNav() {
  return (
    <nav className="flex flex-col gap-1 p-4">
      <Link href="/admin/dashboard">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/admin/wedding-info">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Edit className="h-4 w-4" />
          Edit Wedding Info
        </Button>
      </Link>
      <Link href="/admin/qr">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
      </Link>
      <Link href="/admin/admins">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Users className="h-4 w-4" />
          Admins
        </Button>
      </Link>
      <Separator className="my-2" />
      <form action={async () => {
        "use server";
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect("/admin/login");
      }}>
        <Button variant="ghost" type="submit" className="w-full justify-start gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </form>
    </nav>
  );
}

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

  return (
    <AdminShell nav={<AdminNav />} footer={profileFooter}>
      {children}
    </AdminShell>
  );
}
