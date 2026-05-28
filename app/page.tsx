import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RsvpForm } from "@/components/rsvp-form";
import { Calendar, MapPin, Clock, Shirt, ParkingCircle, Hotel } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { FaqCarousel, type FaqItem } from "@/components/faq-carousel";

interface Section {
  title: string;
  body: string;
}

interface WeddingInfo {
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
  faqs: { question: string; answer: string }[];
  rsvp_deadline: string | null;
}

export const revalidate = 60; // revalidate every minute

export default async function Home() {
  const supabase = await createClient();
  const { data: info } = await supabase
    .from("wedding_info")
    .select("*")
    .eq("id", 1)
    .single();

  const wedding = info as WeddingInfo | null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-SG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Hero */}
      <header className="relative bg-warm-100 py-20 px-4 text-center border-b border-warm-200 overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Wedding couple"
          fill
          sizes="100vw"
          className="object-cover opacity-30"
          priority
        />
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-widest text-warm-500 mb-3 font-sans">
            You are cordially invited to the wedding of
          </p>
          <h1
            className="text-5xl md:text-7xl font-heading text-warm-800 mb-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {wedding?.couple_names ?? "The Happy Couple"}
          </h1>
          {wedding?.event_date && (
            <p className="text-xl text-warm-600 font-sans">
              {formatDate(wedding.event_date)}
            </p>
          )}
          {wedding?.event_date && (
            <CountdownTimer targetDate={wedding.event_date} />
          )}
          {wedding?.rsvp_deadline && (
            <p className="mt-2 text-sm text-warm-500">
              Kindly RSVP by {formatDeadline(wedding.rsvp_deadline)}
            </p>
          )}
          <div className="mt-8">
            <a href="#rsvp">
              <Button size="lg" className="rounded-full px-10 text-base">
                Count me in!
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Details */}
      <main className="max-w-2xl mx-auto px-4 py-16 space-y-12 bg-warm-50">
        {/* Venue & Times */}
        {(wedding?.venue_name || wedding?.ceremony_time || wedding?.reception_time) && (
          <section className="space-y-4">
            <h2
              className="text-2xl text-warm-700"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Event Details
            </h2>
            <Separator />
            <div className="space-y-3 text-warm-600">
              {wedding?.venue_name && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-warm-400 shrink-0" />
                  <div>
                    <p className="font-medium text-warm-800">{wedding.venue_name}</p>
                    {wedding.venue_address && (
                      <p className="text-sm">{wedding.venue_address}</p>
                    )}
                  </div>
                </div>
              )}
              {wedding?.event_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-warm-400 shrink-0" />
                  <p>{formatDate(wedding.event_date)}</p>
                </div>
              )}
              {wedding?.ceremony_time && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-warm-400 shrink-0" />
                  <p>
                    <span className="font-medium">Ceremony:</span>{" "}
                    {wedding.ceremony_time}
                  </p>
                </div>
              )}
              {wedding?.reception_time && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-warm-400 shrink-0" />
                  <p>
                    <span className="font-medium">Reception:</span>{" "}
                    {wedding.reception_time}
                  </p>
                </div>
              )}
              {wedding?.dress_code && (
                <div className="flex items-center gap-3">
                  <Shirt className="h-5 w-5 text-warm-400 shrink-0" />
                  <p>
                    <span className="font-medium">Dress Code:</span>{" "}
                    {wedding.dress_code}
                  </p>
                </div>
              )}
              {wedding?.parking_info && (
                <div className="flex items-start gap-3">
                  <ParkingCircle className="h-5 w-5 mt-0.5 text-warm-400 shrink-0" />
                  <div>
                    <p className="font-medium text-warm-800">Parking</p>
                    <p className="text-sm">{wedding.parking_info}</p>
                  </div>
                </div>
              )}
              {wedding?.accommodations && (
                <div className="flex items-start gap-3">
                  <Hotel className="h-5 w-5 mt-0.5 text-warm-400 shrink-0" />
                  <div>
                    <p className="font-medium text-warm-800">Accommodations</p>
                    <p className="text-sm">{wedding.accommodations}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Dynamic Sections */}
        {wedding?.sections &&
          wedding.sections.map((section: Section, i: number) => (
            <section key={i} className="space-y-4">
              <h2
                className="text-2xl text-warm-700"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {section.title}
              </h2>
              <Separator />
              <p className="text-warm-600 whitespace-pre-line">{section.body}</p>
            </section>
          ))}

        {/* FAQ Carousel */}
        {(() => {
          const faqs: FaqItem[] = [
            wedding?.venue_name && {
              icon: "map-pin" as const,
              question: "Where is the venue?",
              answer: [wedding.venue_name, wedding.venue_address].filter(Boolean).join("\n"),
            },
            (wedding?.ceremony_time || wedding?.reception_time) && {
              icon: "clock" as const,
              question: "What time should I arrive?",
              answer: [
                wedding.ceremony_time && `Ceremony: ${wedding.ceremony_time}`,
                wedding.reception_time && `Reception: ${wedding.reception_time}`,
              ].filter(Boolean).join("\n"),
            },
            wedding?.dress_code && {
              icon: "shirt" as const,
              question: "What's the dress code?",
              answer: wedding.dress_code,
            },
            wedding?.parking_info && {
              icon: "parking" as const,
              question: "Where should I park?",
              answer: wedding.parking_info,
            },
            wedding?.accommodations && {
              icon: "hotel" as const,
              question: "Where can I stay?",
              answer: wedding.accommodations,
            },
            ...(wedding?.faqs ?? []).map((f) => ({
              icon: "help" as const,
              question: f.question,
              answer: f.answer,
            })),
          ].filter(Boolean) as FaqItem[];

          if (faqs.length === 0) return null;

          return (
            <section className="space-y-4">
              <h2
                className="text-2xl text-warm-700"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                FAQs
              </h2>
              <Separator />
              <FaqCarousel items={faqs} />
            </section>
          );
        })()}

        {/* RSVP Form */}
        <section id="rsvp" className="py-8">
          <h2
            className="text-2xl text-warm-700 mb-2"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            RSVP
          </h2>
          <Separator className="mb-6" />
          <p className="text-warm-500 mb-6">
            {wedding?.rsvp_deadline
              ? `Please let us know by ${formatDeadline(wedding.rsvp_deadline)}`
              : "Please let us know if you can make it"}
          </p>
          <p className="text-xs text-warm-400 mb-4">
            Already RSVPed?{" "}
            <a href="/rsvp/edit" className="underline underline-offset-2 hover:text-warm-700">
              Edit your response →
            </a>
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-warm-200 p-6 md:p-8">
            <RsvpForm />
          </div>
        </section>

        {/* Thank you */}
        <section className="py-8 text-center">
          <div className="relative w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-warm-200 shadow-md">
            <Image
              src="/rsvp.jpeg"
              alt="Wedding couple"
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>
          <h2
            className="text-2xl text-warm-800 mb-3"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            We&apos;re so glad you&apos;re here
          </h2>
          <p className="text-warm-600 max-w-sm mx-auto leading-relaxed">
            Thank you for being part of our special day. We truly can&apos;t
            wait to celebrate with you — see you there!
          </p>
        </section>
      </main>
    </div>
  );
}
