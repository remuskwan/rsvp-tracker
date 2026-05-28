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

interface Section {
  title: string;
  body: string;
}

interface FaqEntry {
  question: string;
  answer: string;
}

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
  const [rsvpDeadline, setRsvpDeadline] = useState(initial.rsvp_deadline ?? "");
  const [sections, setSections] = useState<Section[]>(initial.sections ?? []);
  const [faqs, setFaqs] = useState<FaqEntry[]>(initial.faqs ?? []);

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
