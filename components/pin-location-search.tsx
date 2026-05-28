"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface PlacePrediction {
  placeId: string;
  text: { text: string };
  structuredFormat: {
    mainText: { text: string };
    secondaryText?: { text: string };
  };
}

interface PinLocationSearchProps {
  lat: string;
  lng: string;
  onSelect: (lat: string, lng: string, suggestedLabel: string) => void;
}

export function PinLocationSearch({ lat, lng, onSelect }: PinLocationSearchProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ input: query });
        if (userLocation) {
          params.set("lat", String(userLocation.lat));
          params.set("lng", String(userLocation.lng));
        }
        const res = await fetch(`/api/places/autocomplete?${params}`);
        const data = await res.json();
        const items: PlacePrediction[] = (data.suggestions ?? []).map(
          (s: { placePrediction: PlacePrediction }) => s.placePrediction
        );
        setPredictions(items);
        setOpen(items.length > 0);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, userLocation]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = async (prediction: PlacePrediction) => {
    const label = prediction.structuredFormat.mainText.text;
    setQuery(prediction.text.text);
    setOpen(false);
    setPredictions([]);
    setLoading(true);
    try {
      const res = await fetch(`/api/places/details?placeId=${prediction.placeId}`);
      const data = await res.json();
      if (data.location) {
        onSelect(String(data.location.latitude), String(data.location.longitude), label);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const hasCoords = lat && lng;

  return (
    <div ref={containerRef} className="relative space-y-1">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          placeholder="Search for a place or address…"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 animate-spin" />
        )}
      </div>

      {open && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
          {predictions.map((p) => (
            <button
              key={p.placeId}
              type="button"
              className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors"
              onClick={() => handleSelect(p)}
            >
              <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-700 truncate">
                  {p.structuredFormat.mainText.text}
                </p>
                {p.structuredFormat.secondaryText && (
                  <p className="text-xs text-stone-400 truncate">
                    {p.structuredFormat.secondaryText.text}
                  </p>
                )}
              </div>
            </button>
          ))}
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
