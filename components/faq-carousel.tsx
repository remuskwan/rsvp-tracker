"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Clock, Shirt, ParkingCircle, Hotel, HelpCircle } from "lucide-react";

const ICON_MAP = {
  "map-pin": MapPin,
  "clock":   Clock,
  "shirt":   Shirt,
  "parking": ParkingCircle,
  "hotel":   Hotel,
  "help":    HelpCircle,
} as const;

type IconName = keyof typeof ICON_MAP;

export interface FaqItem {
  icon: IconName;
  question: string;
  answer: string;
}

export function FaqCarousel({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="border border-warm-200 rounded-2xl overflow-hidden divide-y divide-warm-100">
      {items.map((item, i) => {
        const Icon = ICON_MAP[item.icon] ?? HelpCircle;
        const isOpen = open === i;

        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left bg-white hover:bg-warm-50 transition-colors"
              aria-expanded={isOpen}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-warm-100 shrink-0">
                <Icon className="h-5 w-5 text-warm-600" />
              </div>
              <span
                className="flex-1 text-warm-800 font-medium"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {item.question}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-warm-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="bg-white px-5 pb-4">
                <div className="flex gap-4">
                  <div className="w-9 shrink-0" />
                  <p className="text-sm text-warm-600 leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
