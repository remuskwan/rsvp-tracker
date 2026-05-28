"use client";

import { useEffect, useRef } from "react";
import { Navigation } from "lucide-react";

export type PinType = "venue" | "pickup" | "mrt" | "parking" | "hotel" | "other";

export interface MapPin {
  label: string;
  type: PinType;
  lat: number;
  lng: number;
  description?: string | null;
}

const PIN_COLORS: Record<PinType, string> = {
  venue:   "#d97706",
  pickup:  "#2563eb",
  mrt:     "#16a34a",
  parking: "#7c3aed",
  hotel:   "#db2777",
  other:   "#6b7280",
};

const PIN_TYPE_LABELS: Record<PinType, string> = {
  venue:   "Venue",
  pickup:  "Pickup / Drop-off",
  mrt:     "MRT Station",
  parking: "Parking",
  hotel:   "Hotel",
  other:   "Other",
};

function markerSvg(color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="12" cy="12" r="4.5" fill="white"/>
  </svg>`;
}

export function MapEmbed({
  pins,
  mapsUrl,
}: {
  pins: MapPin[];
  mapsUrl?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  const serialized = JSON.stringify(pins);

  useEffect(() => {
    if (!containerRef.current || pins.length === 0) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
        maxZoom: 19,
      }).addTo(map);

      const latLngs: [number, number][] = [];

      for (const pin of pins) {
        const icon = L.divIcon({
          html: markerSvg(PIN_COLORS[pin.type]),
          className: "",
          iconSize:    [24, 36],
          iconAnchor:  [12, 36],
          popupAnchor: [0, -38],
        });

        const popup = `
          <div style="font-family:sans-serif;min-width:160px;padding:2px">
            <div style="font-weight:600;font-size:14px;margin-bottom:2px">${pin.label}</div>
            <div style="font-size:11px;color:#888;margin-bottom:${pin.description ? "6px" : "0"}">${PIN_TYPE_LABELS[pin.type]}</div>
            ${pin.description ? `<div style="font-size:13px;color:#444">${pin.description}</div>` : ""}
          </div>`;

        L.marker([pin.lat, pin.lng], { icon }).addTo(map).bindPopup(popup);
        latLngs.push([pin.lat, pin.lng]);
      }

      if (latLngs.length === 1) {
        map.setView(latLngs[0], 16);
      } else {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [48, 48] });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // serialized is a stable dep that changes only when pin data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  return (
    <div className="space-y-3">
      {pins.length > 0 && (
        <div
          ref={containerRef}
          className="w-full rounded-xl overflow-hidden border border-warm-200"
          style={{ height: 400 }}
        />
      )}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-warm-800 text-white text-sm font-medium hover:bg-warm-700 transition-colors"
        >
          <Navigation className="h-4 w-4" />
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
