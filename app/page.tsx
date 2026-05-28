import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, Shirt, ParkingCircle, Hotel } from "lucide-react";

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
          {wedding?.rsvp_deadline && (
            <p className="mt-2 text-sm text-warm-500">
              Kindly RSVP by {formatDeadline(wedding.rsvp_deadline)}
            </p>
          )}
          <div className="mt-8">
            <Link href="/rsvp">
              <Button size="lg" className="rounded-full px-10 text-base">
                RSVP Now
              </Button>
            </Link>
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

        {/* RSVP CTA */}
        <section className="text-center py-8">
          <p className="text-warm-500 mb-4">
            {wedding?.rsvp_deadline
              ? `Please let us know by ${formatDeadline(wedding.rsvp_deadline)}`
              : "Please let us know if you can make it"}
          </p>
          <Link href="/rsvp">
            <Button size="lg" className="rounded-full px-10 text-base">
              RSVP Now
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
