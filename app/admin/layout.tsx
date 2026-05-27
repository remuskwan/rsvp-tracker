import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Edit, QrCode, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-stone-100 border-r border-stone-200 flex flex-col">
        <div className="p-4 border-b border-stone-200">
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-widest">
            Admin
          </h2>
        </div>
        <AdminNav />
      </aside>

      {/* Main */}
      <main className="flex-1 bg-white overflow-auto">{children}</main>
    </div>
  );
}
