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

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[68px] sm:min-w-[96px]">
      <div
        className="text-5xl sm:text-6xl leading-none text-warm-800"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-warm-500 mt-2.5">
        {label}
      </div>
    </div>
  );
}

function Colon() {
  return (
    <div
      className="text-4xl sm:text-5xl leading-[1.1] text-warm-300 select-none"
      style={{ fontFamily: "var(--font-display)" }}
      aria-hidden
    >
      :
    </div>
  );
}

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

  if (mounted && !timeLeft) {
    return (
      <p
        className="mt-2 text-3xl italic text-[var(--forest)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        We&apos;re married! ❤️
      </p>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const t = mounted ? timeLeft : null;

  return (
    <div>
      <div
        className="text-xl sm:text-[22px] italic text-[var(--brass)] mb-5"
        style={{ fontFamily: "var(--font-display)" }}
      >
        counting down to the day
      </div>
      <div className="flex justify-center items-start gap-3 sm:gap-7">
        <Unit value={t ? pad(t.days) : "--"} label="Days" />
        <Colon />
        <Unit value={t ? pad(t.hours) : "--"} label="Hours" />
        <Colon />
        <Unit value={t ? pad(t.minutes) : "--"} label="Minutes" />
        <Colon />
        <Unit value={t ? pad(t.seconds) : "--"} label="Seconds" />
      </div>
    </div>
  );
}
