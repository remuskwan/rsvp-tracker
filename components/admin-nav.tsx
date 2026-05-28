"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Edit, QrCode, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/wedding-info", label: "Edit Wedding Info", icon: Edit },
  { href: "/admin/qr", label: "QR Code", icon: QrCode },
  { href: "/admin/admins", label: "Admins", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 h-8 text-sm font-medium transition-colors cursor-pointer",
              active
                ? "bg-stone-200 text-stone-900"
                : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <Separator className="my-2" />
      <Link
        href="/"
        className="flex items-center gap-2 rounded-lg px-2.5 h-8 text-sm font-medium text-stone-500 hover:bg-stone-200/60 hover:text-stone-900 transition-colors cursor-pointer"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        View Website
      </Link>
    </nav>
  );
}
