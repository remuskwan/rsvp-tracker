"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

type NavItem = { label: string; href: string };

export function SiteNav({
  navItems,
  initials,
}: {
  navItems: NavItem[];
  initials: string;
}) {
  const [open, setOpen] = useState(false);
  const navSplit = Math.ceil(navItems.length / 2);

  const monogram = (
    <span
      className="text-[21px] tracking-[0.32em] normal-case text-[var(--brass)]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {initials}
    </span>
  );

  return (
    <>
      {/* ── Desktop nav ─────────────────────────────────── */}
      <nav className="hidden sm:flex items-center justify-center gap-5 sm:gap-9 py-6 px-4 text-[13px] tracking-[0.16em] uppercase text-[var(--forest)] border-b border-warm-200 flex-wrap">
        {navItems.slice(0, navSplit).map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="hover:text-[var(--brass)] transition-colors"
          >
            {item.label}
          </a>
        ))}
        {monogram}
        {navItems.slice(navSplit).map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="hover:text-[var(--brass)] transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* ── Mobile nav ──────────────────────────────────── */}
      <nav className="sm:hidden border-b border-warm-200">
        <div className="relative flex items-center justify-center py-5 px-4">
          {monogram}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--forest)] hover:text-[var(--brass)] transition-colors p-1"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          className={`grid transition-all duration-200 ease-out ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <ul className="flex flex-col pb-2 text-[13px] tracking-[0.16em] uppercase text-[var(--forest)]">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-6 py-3 text-center hover:text-[var(--brass)] hover:bg-warm-100 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
