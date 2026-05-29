"use client";

import dynamic from "next/dynamic";
import type { MapPin as MapPinData } from "@/components/map-embed";

const VenueMap = dynamic(
  () => import("@/components/venue-map").then((m) => m.VenueMap),
  { ssr: false }
);

interface Props {
  lat: number;
  lng: number;
  venueName: string;
  venueAddress?: string | null;
  venuePhotoUrl?: string | null;
  mapsUrl?: string | null;
  mapPins?: MapPinData[];
}

export function VenueMapLoader(props: Props) {
  return <VenueMap {...props} />;
}
