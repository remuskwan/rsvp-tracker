"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Shirt, ParkingCircle, Hotel, HelpCircle } from "lucide-react";

const ICON_MAP = {
  "map-pin":       MapPin,
  "clock":         Clock,
  "shirt":         Shirt,
  "parking":       ParkingCircle,
  "hotel":         Hotel,
  "help":          HelpCircle,
} as const;

type IconName = keyof typeof ICON_MAP;

export interface FaqItem {
  icon: IconName;
  question: string;
  answer: string;
}

export function FaqCarousel({ items }: { items: FaqItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.offsetWidth, behavior: "smooth" });
    setCurrent(index);
  }, []);

  const prev = () => scrollToIndex(Math.max(0, current - 1));
  const next = () => scrollToIndex(Math.min(items.length - 1, current + 1));

  // Keep dot indicator in sync with touch/momentum scrolling
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const index = Math.round(track.scrollLeft / track.offsetWidth);
        setCurrent(index);
      }, 80);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div>
      {/* Card track */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, i) => {
          const Icon = ICON_MAP[item.icon] ?? HelpCircle;
          return (
            <div
              key={i}
              className="snap-start shrink-0 w-full px-1"
            >
              <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-6 space-y-4 h-full">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warm-100">
                  <Icon className="h-6 w-6 text-warm-600" />
                </div>
                {/* Question */}
                <p
                  className="text-lg font-medium text-warm-800"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {item.question}
                </p>
                {/* Answer */}
                <p className="text-warm-600 text-sm leading-relaxed whitespace-pre-line">
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={prev}
          disabled={current === 0}
          aria-label="Previous"
          className="p-2 rounded-full border border-warm-200 text-warm-500 hover:text-warm-800 hover:border-warm-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? "bg-warm-600" : "bg-warm-200 hover:bg-warm-400"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === items.length - 1}
          aria-label="Next"
          className="p-2 rounded-full border border-warm-200 text-warm-500 hover:text-warm-800 hover:border-warm-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Counter */}
      <p className="text-center text-xs text-warm-400 mt-2">
        {current + 1} / {items.length}
      </p>
    </div>
  );
}
