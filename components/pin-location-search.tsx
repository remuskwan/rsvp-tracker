"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface PinLocationSearchProps {
  lat: string;
  lng: string;
  onSelect: (lat: string, lng: string, suggestedLabel: string) => void;
}

export function PinLocationSearch({ lat, lng, onSelect }: PinLocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        // network error — fail silently
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [query]);

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    const parts = result.display_name.split(",");
    const suggestedLabel = parts[0].trim();
    const shortAddress = parts.slice(0, 3).join(", ").trim();
    onSelect(result.lat, result.lon, suggestedLabel);
    setQuery(shortAddress);
    setOpen(false);
    setResults([]);
  };

  const hasCoords = lat && lng;

  return (
    <div ref={containerRef} className="relative space-y-1">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // clear coords if the user starts editing after a selection
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a place or address…"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
          {results.map((r) => {
            const [name, ...rest] = r.display_name.split(",");
            return (
              <button
                key={r.place_id}
                type="button"
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors"
                onClick={() => handleSelect(r)}
              >
                <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-700 truncate">{name.trim()}</p>
                  <p className="text-xs text-stone-400 truncate">{rest.slice(0, 3).join(",").trim()}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {hasCoords && (
        <p className="text-xs text-stone-400">
          {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
        </p>
      )}
    </div>
  );
}
