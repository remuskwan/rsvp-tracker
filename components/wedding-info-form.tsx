"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { updateWeddingInfo } from "@/app/actions/admin";
import { GripVertical, PlusCircle, Trash2 } from "lucide-react";
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

interface ScheduleEntry {
  time: string;
  title: string;
  detail: string;
}

interface DressColor {
  name: string;
  color: string;
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
  schedule: ScheduleEntry[];
  dress_code: string | null;
  dress_code_details: string | null;
  dress_colors: DressColor[];
  map_pins: { label: string; type: PinType; lat: number; lng: number; address?: string | null; description?: string | null; photo_url?: string | null; maps_url?: string | null }[];
  how_to_get_there: string | null;
  venue_photo_url: string | null;
  sections: Section[];
  faqs: FaqEntry[];
  rsvp_deadline: string | null;
}

function utcToUtc8Input(isoStr: string): string {
  const d = new Date(isoStr);
  const utc8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return utc8.toISOString().slice(0, 16);
}

export function WeddingInfoForm({ initial }: { initial: WeddingInfoData }) {
  const [isPending, startTransition] = useTransition();
  const [coupleNames, setCoupleNames] = useState(initial.couple_names ?? "");
  const [eventDate, setEventDate] = useState(
    initial.event_date ? utcToUtc8Input(initial.event_date) : ""
  );
  const [venueName, setVenueName] = useState(initial.venue_name ?? "");
  const [venueAddress, setVenueAddress] = useState(initial.venue_address ?? "");
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initial.schedule ?? []);
  const [dressCode, setDressCode] = useState(initial.dress_code ?? "");
  const [dressCodeDetails, setDressCodeDetails] = useState(initial.dress_code_details ?? "");
  const [dressColors, setDressColors] = useState<DressColor[]>(initial.dress_colors ?? []);
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const updatePin = (index: number, field: keyof MapPinEntry, value: string) =>
    setMapPins((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const addPin = () =>
    setMapPins((prev) => [...prev, { label: "", type: "other", lat: "", lng: "", address: "", description: "", photo_url: "", maps_url: "" }]);

  const removePin = (index: number) =>
    setMapPins((prev) => prev.filter((_, i) => i !== index));

  const updateDressColor = (index: number, field: keyof DressColor, value: string) =>
    setDressColors((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));

  const addDressColor = () =>
    setDressColors((prev) => [...prev, { name: "", color: "#cccccc" }]);

  const removeDressColor = (index: number) =>
    setDressColors((prev) => prev.filter((_, i) => i !== index));

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

  const updateScheduleRow = (
    index: number,
    field: keyof ScheduleEntry,
    value: string
  ) =>
    setSchedule((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );

  const addScheduleRow = () =>
    setSchedule((prev) => [...prev, { time: "", title: "", detail: "" }]);

  const removeScheduleRow = (index: number) =>
    setSchedule((prev) => prev.filter((_, i) => i !== index));

  const moveScheduleRow = (from: number, to: number) =>
    setSchedule((prev) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= prev.length ||
        to >= prev.length
      )
        return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const endScheduleDrag = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateWeddingInfo({
        couple_names: coupleNames,
        event_date: eventDate ? new Date(eventDate + "+08:00").toISOString() : null,
        venue_name: venueName || null,
        venue_address: venueAddress || null,
        schedule: schedule
          .map((s) => ({
            time: s.time.trim(),
            title: s.title.trim(),
            detail: s.detail.trim(),
          }))
          .filter((s) => s.time || s.title),
        dress_code: dressCode || null,
        dress_code_details: dressCodeDetails || null,
        dress_colors: dressColors
          .map((c) => ({ name: c.name.trim(), color: c.color.trim() }))
          .filter((c) => c.color),
        how_to_get_there: howToGetThere || null,
        venue_photo_url: venuePhotoUrl || null,
        map_pins: mapPins
          .map((p) => ({
            ...p,
            label: p.label || p.address || p.maps_url,
          }))
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
      </section>

      {/* Order of the Day */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">Order of the Day</h2>
        <Separator />
        <p className="text-sm text-stone-500">
          Build the schedule shown in the “Order of the Day” section. Each row has
          a time, a title, and an optional detail line. Drag the handle to
          reorder — rows appear on the public page in this order.
        </p>
        <div className="space-y-4">
          {schedule.map((row, i) => (
            <div
              key={i}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragOverIndex !== i) setDragOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) moveScheduleRow(dragIndex, i);
                endScheduleDrag();
              }}
              className={`border rounded-lg p-4 space-y-3 bg-stone-50 transition-colors ${
                dragIndex === i ? "opacity-50" : ""
              } ${
                dragOverIndex === i && dragIndex !== i
                  ? "border-stone-400 ring-2 ring-stone-300"
                  : "border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragEnd={endScheduleDrag}
                    aria-label={`Drag to reorder item ${i + 1}`}
                    className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 touch-none"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-stone-500">
                    Item {i + 1}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeScheduleRow(i)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
                <div className="space-y-1">
                  <Label>Time</Label>
                  <Input
                    value={row.time}
                    onChange={(e) => updateScheduleRow(i, "time", e.target.value)}
                    placeholder="2:00 PM"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input
                    value={row.title}
                    onChange={(e) => updateScheduleRow(i, "title", e.target.value)}
                    placeholder="e.g. Ceremony"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Detail <span className="text-stone-400 font-normal">(optional)</span></Label>
                <Input
                  value={row.detail}
                  onChange={(e) => updateScheduleRow(i, "detail", e.target.value)}
                  placeholder="e.g. A seated feast to follow"
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addScheduleRow}
          className="w-full border-dashed"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add item
        </Button>
      </section>

      {/* Dress Code */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-700">Dress Code</h2>
        <Separator />
        <div className="space-y-1">
          <Label htmlFor="dress_code">Dress Code</Label>
          <Input
            id="dress_code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="Smart casual, cocktail attire, etc."
          />
          <p className="text-xs text-stone-400">
            Shown as the heading of the &ldquo;What to Wear&rdquo; section.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dress_code_details">Additional Details</Label>
          <Textarea
            id="dress_code_details"
            value={dressCodeDetails}
            onChange={(e) => setDressCodeDetails(e.target.value)}
            placeholder="We'd love for guests to lean into earthy tones — think garden-party elegant…"
            rows={3}
          />
          <p className="text-xs text-stone-400">
            Optional paragraph shown under the heading. Line breaks are preserved.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Suggested Colors</Label>
          {dressColors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={c.color}
                onChange={(e) => updateDressColor(i, "color", e.target.value)}
                className="h-9 w-12 shrink-0 cursor-pointer rounded border border-stone-200 bg-white p-0.5"
                aria-label="Swatch color"
              />
              <Input
                value={c.name}
                onChange={(e) => updateDressColor(i, "name", e.target.value)}
                placeholder="Color name (e.g. Sage)"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeDressColor(i)}
                aria-label="Remove color"
                className="shrink-0 text-stone-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDressColor}
            className="w-full border-dashed"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add color
          </Button>
          <p className="text-xs text-stone-400">
            Swatches shown as a palette under the dress code. Leave empty to hide them.
          </p>
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
            Shown below the map. Line breaks are preserved. Reference a pin
            with <code className="px-1 py-0.5 rounded bg-stone-100 text-stone-600">[[Pin Label]]</code>
            {" "}— it renders as a colored numbered badge matching the map.
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
