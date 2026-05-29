"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const UNITS: { key: keyof TimeLeft; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const initId = setTimeout(() => {
      setMounted(true);
      setTimeLeft(computeTimeLeft(targetDate));
    }, 0);
    const id = setInterval(() => setTimeLeft(computeTimeLeft(targetDate)), 1000);
    return () => {
      clearTimeout(initId);
      clearInterval(id);
    };
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="flex justify-center gap-2 sm:gap-4 mt-6">
        {UNITS.map(({ label }) => (
          <div
            key={label}
            className="bg-white/60 dark:bg-warm-100/40 backdrop-blur-sm border border-stone-200 dark:border-warm-200/40 rounded-lg px-4 py-3 min-w-[64px] text-center"
          >
            <p className="text-3xl sm:text-4xl text-stone-800 dark:text-warm-800" style={{ fontFamily: "var(--font-playfair)" }}>
              --
            </p>
            <p className="text-xs uppercase tracking-widest text-stone-500 dark:text-warm-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <p className="mt-6 text-xl text-stone-700" style={{ fontFamily: "var(--font-playfair)" }}>
        We&apos;re married! ❤️
      </p>
    );
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-4 mt-6">
      {UNITS.map(({ key, label }) => (
        <div
          key={label}
          className="bg-white/60 dark:bg-warm-100/40 backdrop-blur-sm border border-stone-200 dark:border-warm-200/40 rounded-lg px-4 py-3 min-w-[64px] text-center"
        >
          <p className="text-3xl sm:text-4xl text-stone-800" style={{ fontFamily: "var(--font-playfair)" }}>
            {String(timeLeft[key]).padStart(2, "0")}
          </p>
          <p className="text-xs uppercase tracking-widest text-stone-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
