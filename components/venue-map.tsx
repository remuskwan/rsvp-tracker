"use client";

import { useState, useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { ExternalLink, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
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
  maps_url?: string | null;
  lat: number;
  lng: number;
  type: PinType;
  description?: string | null;
  number: number;
}

interface VenueMapProps {
  /** Optional centering anchor (e.g. the venue area) used only when there are no pins. */
  lat?: number | null;
  lng?: number | null;
  /** The markers shown on the map. The map is driven entirely by these. */
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

export function VenueMap({ lat, lng, mapPins = [] }: VenueMapProps) {
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [open, setOpen] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
  const { resolvedTheme } = useTheme();
  const mapStyle = resolvedTheme === "dark"
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  const handleSelect = (pin: SelectedPin) => {
    setSelected(pin);
    setOpen(true);
  };

  const allPins: SelectedPin[] = useMemo(
    () => mapPins.map((p, i) => ({ ...p, address: p.description ?? null, number: i + 1 })),
    [mapPins]
  );

  // Anchor the map on the pins themselves; fall back to the venue coordinates
  // (when supplied) only while there are no pins to show.
  const center = useMemo(() => {
    if (allPins.length > 0) {
      const lngs = allPins.map((p) => p.lng);
      const lats = allPins.map((p) => p.lat);
      return {
        lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
        lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      };
    }
    if (lat != null && lng != null) return { lng, lat };
    return null;
  }, [allPins, lat, lng]);

  const initialViewState = useMemo(() => {
    if (allPins.length === 0) {
      return center
        ? { longitude: center.lng, latitude: center.lat, zoom: 15 }
        : undefined;
    }
    if (allPins.length === 1) {
      return { longitude: allPins[0].lng, latitude: allPins[0].lat, zoom: 15 };
    }
    const lngs = allPins.map((p) => p.lng);
    const lats = allPins.map((p) => p.lat);
    return {
      bounds: [
        [Math.min(...lngs) - 0.004, Math.min(...lats) - 0.004],
        [Math.max(...lngs) + 0.004, Math.max(...lats) + 0.004],
      ] as [[number, number], [number, number]],
      fitBoundsOptions: { padding: 60 },
    };
  }, [allPins, center]);

  // Keep the viewport within ~10km of the map's anchor so users can't pan away to the world.
  const maxBounds = useMemo<[[number, number], [number, number]] | undefined>(() => {
    if (!center) return undefined;
    const radiusKm = 10;
    const latDelta = radiusKm / 111.32;
    const lngDelta = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
    return [
      [center.lng - lngDelta, center.lat - latDelta],
      [center.lng + lngDelta, center.lat + latDelta],
    ];
  }, [center]);

  const directionsUrl = selected
    ? `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`
    : "";
  // Prefer an admin-supplied Google Maps URL so the link opens the real place
  // page (name, photos, reviews) instead of dropping a generic pin at lat/lng.
  const viewOnMapsUrl = selected
    ? selected.maps_url
      ? selected.maps_url
      : `https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`
    : "";

  if (!center) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-warm-200 shadow-sm">
      <div className="relative" style={{ height: 420 }}>
        <Map
          mapboxAccessToken={token}
          initialViewState={initialViewState}
          maxBounds={maxBounds}
          minZoom={11}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
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
          className={`absolute inset-y-0 left-0 w-full sm:w-80 bg-card border-r border-warm-200 shadow-lg transform transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "-translate-x-full pointer-events-none"}`}
          aria-hidden={!open}
        >
          {selected && (
            <>
              {selected.photo_url && (
                <div className="relative h-44 bg-warm-50 shrink-0">
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
