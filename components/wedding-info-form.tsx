"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { updateWeddingInfo } from "@/app/actions/admin";
import { PlusCircle, Trash2 } from "lucide-react";
import { PinLocationSearch } from "@/components/pin-location-search";
import { PinImageUpload } from "@/components/pin-image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type PinType } from "@/components/map-embed";

interface Section {
  title: string;
  body: string;
}

interface FaqEntry {
  question: string;
  answer: string;
}

interface MapPinEntry {
  label: string;
  type: PinType;
  lat: string;
  lng: string;
  address: string;
  description: string;
  photo_url: string;
  maps_url: string;
}

const PIN_TYPE_OPTIONS: { value: PinType; label: string }[] = [
  { value: "venue",   label: "Venue" },
  { value: "pickup",  label: "Pickup / Drop-off" },
  { value: "mrt",     label: "MRT Station" },
  { value: "parking", label: "Parking" },
  { value: "hotel",   label: "Hotel" },
  { value: "other",   label: "Other" },
];

const PIN_COLORS: Record<PinType, string> = {
  venue:   "#d97706",
  pickup:  "#2563eb",
  mrt:     "#16a34a",
  parking: "#7c3aed",
  hotel:   "#db2777",
  other:   "#6b7280",
};

interface WeddingInfoData {
  couple_names: string;
  event_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  ceremony_time: string | null;
  reception_time: string | null;
  dress_code: string | null;
  parking_info: string | null;
  accommodations: string | null;
  maps_url: string | null;
  map_pins: { label: string; type: PinType; lat: number; lng: number; address?: string | null; description?: string | null; photo_url?: string | null; maps_url?: string | null }[];
  how_to_get_there: string | null;
  venue_photo_url: string | null;
  sections: Section[];
  faqs: FaqEntry[];
  rsvp_deadline: string | null;
}

export function WeddingInfoForm({ initial }: { initial: WeddingInfoData }) {
  const [isPending, startTransition] = useTransition();
  const [coupleNames, setCoupleNames] = useState(initial.couple_names ?? "");
  const [eventDate, setEventDate] = useState(
    initial.event_date ? initial.event_date.slice(0, 16) : ""
  );
  const [venueName, setVenueName] = useState(initial.venue_name ?? "");
  const [venueAddress, setVenueAddress] = useState(initial.venue_address ?? "");
  const [ceremonyTime, setCeremonyTime] = useState(initial.ceremony_time ?? "");
  const [receptionTime, setReceptionTime] = useState(initial.reception_time ?? "");
  const [dressCode, setDressCode] = useState(initial.dress_code ?? "");
  const [parkingInfo, setParkingInfo] = useState(initial.parking_info ?? "");
  const [accommodations, setAccommodations] = useState(initial.accommodations ?? "");
  const [mapsUrl, setMapsUrl] = useState(initial.maps_url ?? "");
  const [howToGetThere, setHowToGetThere] = useState(initial.how_to_get_there ?? "");
  const [venuePhotoUrl, setVenuePhotoUrl] = useState<string | null>(initial.venue_photo_url ?? null);
  const [mapPins, setMapPins] = useState<MapPinEntry[]>(
    (initial.map_pins ?? []).map((p) => ({
      label: p.label,
      type: p.type,
      lat: String(p.lat),
      lng: String(p.lng),
      address: p.address ?? "",
      description: p.description ?? "",
      photo_url: p.photo_url ?? "",
      maps_url: p.maps_url ?? "",
    }))
  );
  const [rsvpDeadline, setRsvpDeadline] = useState(initial.rsvp_deadline ?? "");
  const [sections, setSections] = useState<Section[]>(initial.sections ?? []);
  const [faqs, setFaqs] = useState<FaqEntry[]>(initial.faqs ?? []);

  const updatePin = (index: number, field: keyof MapPinEntry, value: string) =>
    setMapPins((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const addPin = () =>
    setMapPins((prev) => [...prev, { label: "", type: "other", lat: "", lng: "", address: "", description: "", photo_url: "", maps_url: "" }]);

  const removePin = (index: number) =>
    setMapPins((prev) => prev.filter((_, i) => i !== index));

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    setFaqs((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  };

  const addFaq = () => setFaqs((prev) => [...prev, { question: "", answer: "" }]);

  const removeFaq = (index: number) =>
    setFaqs((prev) => prev.filter((_, i) => i !== index));

  const updateSection = (index: number, field: "title" | "body", value: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addSection = () =>
    setSections((prev) => [...prev, { title: "", body: "" }]);

  const removeSection = (index: number) =>
    setSections((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateWeddingInfo({
        couple_names: coupleNames,
        event_date: eventDate || null,
        venue_name: venueName || null,
        venue_address: venueAddress || null,
        ceremony_time: ceremonyTime || null,
        reception_time: receptionTime || null,
        dress_code: dressCode || null,
        parking_info: parkingInfo || null,
        accommodations: accommodations || null,
        maps_url: mapsUrl || null,
        how_to_get_there: howToGetThere || null,
        venue_photo_url: venuePhotoUrl || null,
        map_pins: mapPins
          .filter((p) => p.label && p.lat && p.lng)
          .map((p) => ({
            label: p.label,
            type: p.type,
            lat: parseFloat(p.lat),
            lng: parseFloat(p.lng),
            address: p.address || null,
            description: p.description || null,
            photo_url: p.photo_url || null,
            maps_url: p.maps_url || null,
          })),
        rsvp_deadline: rsvpDeadline || null,
        sections,
        faqs,
      });

      if (result.success) {
        toast.success("Wedding info updated!");
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Core */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">Couple & Date</h2>
        <Separator />
        <div className="space-y-1">
          <Label htmlFor="couple_names">Couple Names *</Label>
          <Input
            id="couple_names"
            value={coupleNames}
            onChange={(e) => setCoupleNames(e.target.value)}
            placeholder="Alice & Bob"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="event_date">Event Date & Time</Label>
            <Input
              id="event_date"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
            <Input
              id="rsvp_deadline"
              type="date"
              value={rsvpDeadline}
              onChange={(e) => setRsvpDeadline(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Venue */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">Venue</h2>
        <Separator />
        <div className="space-y-1">
          <Label htmlFor="venue_name">Venue Name</Label>
          <Input
            id="venue_name"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="Grand Ballroom Hotel"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="venue_address">Venue Address</Label>
          <Textarea
            id="venue_address"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
            placeholder="123 Orchard Road, Singapore 238888"
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <Label>Venue Photo</Label>
          <PinImageUpload url={venuePhotoUrl} onChange={setVenuePhotoUrl} />
          <p className="text-xs text-stone-400">Shown in the map card when guests tap the venue pin.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="ceremony_time">Ceremony Time</Label>
            <Input
              id="ceremony_time"
              value={ceremonyTime}
              onChange={(e) => setCeremonyTime(e.target.value)}
              placeholder="2:00 PM"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reception_time">Reception Time</Label>
            <Input
              id="reception_time"
              value={receptionTime}
              onChange={(e) => setReceptionTime(e.target.value)}
              placeholder="7:00 PM"
            />
          </div>
        </div>
      </section>

      {/* Logistics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">Logistics</h2>
        <Separator />
        <div className="space-y-1">
          <Label htmlFor="dress_code">Dress Code</Label>
          <Input
            id="dress_code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="Smart casual, cocktail attire, etc."
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="parking_info">Parking Information</Label>
          <Textarea
            id="parking_info"
            value={parkingInfo}
            onChange={(e) => setParkingInfo(e.target.value)}
            placeholder="Free parking available at the venue basement…"
            rows={3}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="accommodations">Accommodations</Label>
          <Textarea
            id="accommodations"
            value={accommodations}
            onChange={(e) => setAccommodations(e.target.value)}
            placeholder="Room block at Grand Ballroom Hotel — use code WEDDING for 15% off…"
            rows={3}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="maps_url">Google Maps Link</Label>
          <Input
            id="maps_url"
            type="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
          />
        </div>
      </section>

      {/* How to Get There */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">How to Get There</h2>
        <Separator />
        <div className="space-y-1">
          <Label htmlFor="how_to_get_there">Transport Details</Label>
          <Textarea
            id="how_to_get_there"
            value={howToGetThere}
            onChange={(e) => setHowToGetThere(e.target.value)}
            placeholder={"By Car\nUnderground parking at...\n\nBy MRT\nBayfront MRT: 10 min walk..."}
            rows={8}
          />
          <p className="text-xs text-stone-400">
            Shown below the map. Use plain text — line breaks are preserved.
          </p>
        </div>
      </section>

      {/* Map Pins */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">Map Pins</h2>
        <Separator />
        <p className="text-sm text-stone-500">
          Add pins to the interactive map — venue entrance, pickup/drop-off points, MRT stations, etc.
          Search by name or address to place each pin.
        </p>
        <div className="space-y-4">
          {mapPins.map((pin, i) => (
            <div
              key={i}
              className="border border-stone-200 rounded-lg p-4 space-y-3 bg-stone-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ background: PIN_COLORS[pin.type] }}
                  />
                  <span className="text-xs font-medium text-stone-500">Pin {i + 1}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePin(i)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input
                    value={pin.label}
                    onChange={(e) => updatePin(i, "label", e.target.value)}
                    placeholder="e.g. Main Entrance"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={pin.type}
                    onValueChange={(v) => v && updatePin(i, "type", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIN_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <PinLocationSearch
                  address={pin.address}
                  onSelect={(lat, lng, suggestedLabel, address) => {
                    setMapPins((prev) =>
                      prev.map((p, idx) =>
                        idx === i
                          ? { ...p, lat, lng, address, label: p.label || suggestedLabel }
                          : p
                      )
                    );
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Description <span className="text-stone-400 font-normal">(optional)</span></Label>
                <Input
                  value={pin.description}
                  onChange={(e) => updatePin(i, "description", e.target.value)}
                  placeholder="e.g. Use the side entrance on Orchard Road"
                />
              </div>
              <div className="space-y-1">
                <Label>Photo <span className="text-stone-400 font-normal">(optional)</span></Label>
                <PinImageUpload
                  url={pin.photo_url || null}
                  onChange={(url) => updatePin(i, "photo_url", url ?? "")}
                />
              </div>
              <div className="space-y-1">
                <Label>Google Maps Link <span className="text-stone-400 font-normal">(optional)</span></Label>
                <Input
                  type="url"
                  value={pin.maps_url}
                  onChange={(e) => updatePin(i, "maps_url", e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addPin}
          className="w-full border-dashed"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add pin
        </Button>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">FAQ</h2>
        <Separator />
        <p className="text-sm text-stone-500">
          Add questions and answers that will appear in the FAQ accordion on the public page.
        </p>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-stone-200 rounded-lg p-4 space-y-3 bg-stone-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">
                  Question {i + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFaq(i)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label>Question</Label>
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  placeholder="e.g. Is there a gift registry?"
                />
              </div>
              <div className="space-y-1">
                <Label>Answer</Label>
                <Textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  placeholder="Write your answer here…"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addFaq}
          className="w-full border-dashed"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add question
        </Button>
      </section>

      {/* Custom sections */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">
          Additional Sections
        </h2>
        <Separator />
        <p className="text-sm text-stone-500">
          Add extra content blocks (FAQ, registry, travel tips, etc.) that will
          appear on the public page.
        </p>
        <div className="space-y-4">
          {sections.map((section, i) => (
            <div
              key={i}
              className="border border-stone-200 rounded-lg p-4 space-y-3 bg-stone-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">
                  Section {i + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(i)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(i, "title", e.target.value)}
                  placeholder="e.g. Registry, FAQ, Getting Here"
                />
              </div>
              <div className="space-y-1">
                <Label>Content</Label>
                <Textarea
                  value={section.body}
                  onChange={(e) => updateSection(i, "body", e.target.value)}
                  placeholder="Write your content here…"
                  rows={4}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addSection}
          className="w-full border-dashed"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add section
        </Button>
      </section>

      <div className="pt-4 border-t border-stone-200">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
