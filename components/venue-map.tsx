"use client";

import { useState, useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { ExternalLink, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MapPin as MapPinData, PinType } from "@/components/map-embed";

const PIN_COLORS: Record<PinType, string> = {
  venue:   "#78564a",
  pickup:  "#2563eb",
  mrt:     "#16a34a",
  parking: "#7c3aed",
  hotel:   "#db2777",
  other:   "#6b7280",
};

const PIN_LABELS: Record<PinType, string> = {
  venue:   "Venue",
  pickup:  "Pickup / Drop-off",
  mrt:     "MRT Station",
  parking: "Parking",
  hotel:   "Hotel",
  other:   "Other",
};

interface SelectedPin {
  label: string;
  address?: string | null;
  photo_url?: string | null;
  lat: number;
  lng: number;
  type: PinType;
  description?: string | null;
  number: number;
}

interface VenueMapProps {
  lat: number;
  lng: number;
  venueName: string;
  venueAddress?: string | null;
  venuePhotoUrl?: string | null;
  mapPins?: MapPinData[];
}

function PinMarker({ color, number, onClick }: { color: string; number: number; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="View location details" className="cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40" width="28" height="40" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}>
        <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill={color} stroke="white" strokeWidth="1.5"/>
        <text x="14" y="18.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">{number}</text>
      </svg>
    </button>
  );
}

export function VenueMap({ lat, lng, venueName, venueAddress, venuePhotoUrl, mapPins = [] }: VenueMapProps) {
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [open, setOpen] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  const handleSelect = (pin: SelectedPin) => {
    setSelected(pin);
    setOpen(true);
  };

  const allPins: SelectedPin[] = useMemo(() => [
    { label: venueName, address: venueAddress, photo_url: venuePhotoUrl, lat, lng, type: "venue" as PinType, number: 1 },
    ...mapPins.map((p, i) => ({ ...p, address: p.description ?? null, number: i + 2 })),
  ], [lat, lng, venueName, venueAddress, venuePhotoUrl, mapPins]);

  const initialViewState = useMemo(() => {
    if (allPins.length <= 1) return { longitude: lng, latitude: lat, zoom: 15 };
    const lngs = allPins.map((p) => p.lng);
    const lats = allPins.map((p) => p.lat);
    return {
      bounds: [
        [Math.min(...lngs) - 0.004, Math.min(...lats) - 0.004],
        [Math.max(...lngs) + 0.004, Math.max(...lats) + 0.004],
      ] as [[number, number], [number, number]],
      fitBoundsOptions: { padding: 60 },
    };
  }, [allPins, lat, lng]);

  const directionsUrl = selected
    ? `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`
    : "";
  const viewOnMapsUrl = selected
    ? `https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`
    : "";

  return (
    <div className="rounded-xl overflow-hidden border border-warm-200 shadow-sm">
      <div className="relative" style={{ height: 300 }}>
        <Map
          mapboxAccessToken={token}
          initialViewState={initialViewState}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          <NavigationControl position="top-right" showCompass={false} />
          {allPins.map((pin, i) => (
            <Marker key={i} longitude={pin.lng} latitude={pin.lat} anchor="bottom"
              onClick={() => handleSelect(pin)}>
              <PinMarker color={PIN_COLORS[pin.type]} number={i + 1} onClick={() => handleSelect(pin)} />
            </Marker>
          ))}
        </Map>

        {/* Slide-in side panel */}
        <div
          className={`absolute inset-y-0 right-0 w-full sm:w-80 bg-white border-l border-warm-100 shadow-lg transform transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
          aria-hidden={!open}
        >
          {selected && (
            <>
              {selected.photo_url && (
                <div className="relative aspect-video bg-warm-50 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.photo_url} alt={selected.label} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="px-4 py-3 space-y-1 overflow-y-auto">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold shrink-0"
                        style={{ background: PIN_COLORS[selected.type] }}
                      >
                        {selected.number}
                      </span>
                      <span
                        className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: PIN_COLORS[selected.type] + "22", color: PIN_COLORS[selected.type] }}
                      >
                        {PIN_LABELS[selected.type]}
                      </span>
                    </div>
                    <p className="font-semibold text-warm-900 text-sm leading-snug">{selected.label}</p>
                    {selected.address && (
                      <p className="text-xs text-warm-500 mt-0.5 break-words">{selected.address}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-warm-400 hover:text-warm-700 shrink-0 -mt-0.5 -mr-1 p-1"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button size="sm" className="w-full gap-2 mt-2">
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </Button>
                </a>
                <a
                  href={viewOnMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-warm-500 hover:text-warm-700 mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open in Google Maps
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
