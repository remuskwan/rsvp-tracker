"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export function AdminShell({
  nav,
  footer,
  children,
}: {
  nav: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 bg-stone-100 dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 flex-col">
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-widest">
            Admin
          </h2>
        </div>
        {nav}
        {footer && <div className="mt-auto">{footer}</div>}
      </aside>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-stone-100 dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 flex flex-col z-50 md:hidden transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-widest">
            Admin
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 p-1 rounded"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {nav}
        {footer && <div className="mt-auto">{footer}</div>}
      </aside>

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 p-1 rounded"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-widest">
            Admin
          </h2>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-white dark:bg-stone-900 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
