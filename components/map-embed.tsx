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
  photo_url?: string | null;
  maps_url?: string | null;
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

function markerEl(color: string) {
  const el = document.createElement("div");
  el.style.cssText = "width:28px;height:40px;cursor:pointer";
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40" width="28" height="40">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="5.5" fill="white"/>
  </svg>`;
  return el;
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
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        zoom: 13,
        // temporary center — will be overridden after load
        center: [pins[0].lng, pins[0].lat],
      });

      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;

        const bounds = new mapboxgl.LngLatBounds();

        for (const pin of pins) {
          const popup = new mapboxgl.Popup({ offset: 30, closeButton: false })
            .setHTML(`
              <div style="font-family:sans-serif;min-width:160px;padding:4px 2px">
                <div style="font-weight:600;font-size:14px;margin-bottom:2px">${pin.label}</div>
                <div style="font-size:11px;color:#888;margin-bottom:${pin.description ? "6px" : "0"}">${PIN_TYPE_LABELS[pin.type]}</div>
                ${pin.description ? `<div style="font-size:13px;color:#444">${pin.description}</div>` : ""}
              </div>`);

          new mapboxgl.Marker({ element: markerEl(PIN_COLORS[pin.type]) })
            .setLngLat([pin.lng, pin.lat])
            .setPopup(popup)
            .addTo(map);

          bounds.extend([pin.lng, pin.lat]);
        }

        if (pins.length === 1) {
          map.flyTo({ center: [pins[0].lng, pins[0].lat], zoom: 16 });
        } else {
          map.fitBounds(bounds, { padding: 60, maxZoom: 17 });
        }
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
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
