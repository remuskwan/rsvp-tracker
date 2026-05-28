"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Settings } from "lucide-react";

export function AdminFab() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => setShow(!!session));
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/admin/dashboard"
      aria-label="Admin panel"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-stone-800/80 text-white shadow-lg hover:bg-stone-900 transition-colors backdrop-blur-sm"
    >
      <Settings className="h-5 w-5" />
    </Link>
  );
}
