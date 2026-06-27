import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { RsvpForm } from "@/components/rsvp-form";
import { CountdownTimer } from "@/components/countdown-timer";
import { VenueMapLoader } from "@/components/venue-map-loader";
import { HowToGetThereText, type PinRef } from "@/components/how-to-get-there";
import type { MapPin as MapPinData } from "@/components/map-embed";

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
  schedule: { time: string; title: string; detail: string }[] | null;
  dress_code: string | null;
  parking_info: string | null;
  accommodations: string | null;
  sections: Section[];
  faqs: { question: string; answer: string }[];
  rsvp_deadline: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  venue_photo_url: string | null;
  maps_url: string | null;
  map_pins: MapPinData[];
  how_to_get_there: string | null;
}

export const revalidate = 60; // revalidate every minute

const DRESS_SWATCHES = [
  { name: "Sage", color: "#9caa86", border: false },
  { name: "Blush", color: "#e7cfc4", border: false },
  { name: "Stone", color: "#d8cead", border: false },
  { name: "Forest", color: "#3a5240", border: true },
];

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

  // Split "Remus & Xiaowen" into two stacked names where possible.
  const names = (wedding?.couple_names ?? "The Happy Couple").split(
    /\s*(?:&|and)\s*/i
  );
  const [firstName, secondName] =
    names.length === 2 ? names : [names.join(" "), null];

  // Schedule rows come from the editable "Order of the Day" list. Fall back to
  // the legacy ceremony / reception time fields when no schedule is set.
  const scheduleRows =
    wedding?.schedule && wedding.schedule.length > 0
      ? wedding.schedule
      : ([
          wedding?.ceremony_time && {
            time: wedding.ceremony_time,
            title: "Ceremony",
            detail: wedding.venue_name ?? "Among the blooms",
          },
          wedding?.reception_time && {
            time: wedding.reception_time,
            title: "Reception",
            detail: "A seated feast to follow",
          },
        ].filter(Boolean) as { time: string; title: string; detail: string }[]);

  const navItems = [
    scheduleRows.length > 0 && { label: "Schedule", href: "#schedule" },
    wedding?.venue_name && { label: "Venue", href: "#venue" },
    wedding?.dress_code && { label: "Dress Code", href: "#dress" },
    { label: "RSVP", href: "#rsvp" },
  ].filter(Boolean) as { label: string; href: string }[];

  const initials =
    names.length === 2 ? `${firstName[0]} & ${secondName?.[0] ?? ""}` : "♥";

  const navSplit = Math.ceil(navItems.length / 2);

  return (
    <div className="min-h-screen bg-[#e7e5df] dark:bg-warm-50">
      <div className="max-w-[980px] mx-auto bg-warm-50 text-warm-800">
        {/* ── Nav ───────────────────────────────────────── */}
        <nav className="flex items-center justify-center gap-5 sm:gap-9 py-6 px-4 text-[13px] tracking-[0.16em] uppercase text-[var(--forest)] border-b border-warm-200 flex-wrap">
          {navItems.slice(0, navSplit).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[var(--brass)] transition-colors"
            >
              {item.label}
            </a>
          ))}
          <span
            className="text-[21px] tracking-[0.32em] normal-case text-[var(--brass)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {initials}
          </span>
          {navItems.slice(navSplit).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[var(--brass)] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ── Hero ──────────────────────────────────────── */}
        <header className="text-center px-6 sm:px-16 pt-16 sm:pt-20 pb-12 sm:pb-14">
          <p className="text-[13px] tracking-[0.34em] uppercase text-[var(--brass)] mb-6">
            Together with their families
          </p>
          <h1
            className="font-medium leading-[0.98] text-warm-800 m-0 text-6xl sm:text-[96px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {firstName}
            {secondName && (
              <>
                <br />
                <span
                  className="italic font-normal text-[var(--brass)] inline-block my-2.5 text-4xl sm:text-[58px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  &amp;
                </span>
                <br />
                {secondName}
              </>
            )}
          </h1>
          <div className="w-[54px] h-px bg-[#c2b89f] mx-auto my-8" />
          <p
            className="text-xl sm:text-2xl tracking-[0.04em] text-[var(--forest)] m-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            request the pleasure of your company
            <br />
            as they are married beneath the canopy
          </p>
          {wedding?.event_date && (
            <p className="text-sm sm:text-base tracking-[0.22em] uppercase mt-5 text-warm-500">
              {formatDate(wedding.event_date)}
            </p>
          )}
        </header>

        {/* ── Countdown ─────────────────────────────────── */}
        {wedding?.event_date && (
          <div className="text-center px-6 sm:px-16 pb-16 sm:pb-[70px]">
            <CountdownTimer targetDate={wedding.event_date} />
          </div>
        )}

        {/* ── Hero image ────────────────────────────────── */}
        <div className="relative h-[320px] sm:h-[460px] overflow-hidden">
          <Image
            src="/hero.jpg"
            alt={wedding?.couple_names ?? "The couple"}
            fill
            sizes="980px"
            className="object-cover"
            priority
          />
        </div>

        {/* ── Invitation line ───────────────────────────── */}
        {wedding?.sections?.[0]?.body && (
          <div className="text-center px-8 sm:px-28 py-14 sm:py-[66px]">
            <p
              className="italic text-2xl sm:text-[31px] leading-[1.5] text-[var(--forest)] m-0"
              style={{ fontFamily: "var(--font-display)" }}
            >
              &ldquo;{wedding.sections[0].body}&rdquo;
            </p>
          </div>
        )}

        {/* ── Order of the Day ──────────────────────────── */}
        {scheduleRows.length > 0 && (
          <section
            id="schedule"
            className="bg-warm-100 px-6 sm:px-[90px] py-14 sm:py-[70px]"
          >
            <div className="text-center mb-10 sm:mb-12">
              <div className="text-[13px] tracking-[0.3em] uppercase text-[var(--brass)]">
                The Day
              </div>
              <h2
                className="font-medium text-4xl sm:text-5xl mt-2 text-warm-800"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Order of the Day
              </h2>
            </div>
            <div className="max-w-[540px] mx-auto grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] gap-x-6 sm:gap-x-7">
              {scheduleRows.map((row, i) => {
                const border =
                  i === scheduleRows.length - 1 ? "" : "border-b border-[#d6d2bf]";
                return (
                  <div key={i} className="contents">
                    <div
                      className={`text-right text-2xl sm:text-[26px] text-[var(--brass)] py-4 sm:py-[18px] ${border}`}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {row.time}
                    </div>
                    <div className={`py-4 sm:py-[18px] ${border}`}>
                      <div className="text-lg sm:text-[19px] text-warm-800">
                        {row.title}
                      </div>
                      {row.detail && (
                        <div className="text-warm-500 text-[15px]">{row.detail}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Venue ─────────────────────────────────────── */}
        {wedding?.venue_name && (
          <section id="venue">
            <div className="grid md:grid-cols-2 items-stretch">
              <div className="overflow-hidden min-h-[280px] md:min-h-[440px] relative">
                <Image
                  src={wedding.venue_photo_url || "/rsvp.jpeg"}
                  alt={wedding.venue_name}
                  fill
                  sizes="(max-width: 768px) 100vw, 490px"
                  className="object-cover"
                />
              </div>
              <div className="px-8 sm:px-14 py-12 sm:py-[60px]">
                <div className="text-[13px] tracking-[0.3em] uppercase text-[var(--brass)]">
                  The Place
                </div>
                <h2
                  className="font-medium text-3xl sm:text-[42px] mt-2 mb-4 text-warm-800"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {wedding.venue_name}
                </h2>
                {wedding.venue_address && (
                  <p className="text-[17px] leading-[1.6] text-warm-700 m-0 whitespace-pre-line">
                    {wedding.venue_address}
                  </p>
                )}
                <div className="h-px bg-[#d6d2bf] my-6" />
                {wedding.how_to_get_there ? (
                  <HowToGetThereText
                    text={wedding.how_to_get_there}
                    pins={(wedding.map_pins ?? []).map((p, i) => ({
                      label: p.label,
                      type: p.type,
                      number: i + 1,
                    } satisfies PinRef))}
                  />
                ) : (
                  <p className="text-base text-warm-700 m-0">
                    Details on getting there will follow with your invitation.
                  </p>
                )}
              </div>
            </div>
            {(wedding.map_pins?.length ?? 0) > 0 && (
              <div className="px-6 sm:px-[90px] py-12 sm:py-14 bg-warm-50">
                <VenueMapLoader
                  lat={wedding.venue_lat}
                  lng={wedding.venue_lng}
                  mapPins={wedding.map_pins ?? []}
                />
              </div>
            )}
          </section>
        )}

        {/* ── Dress code ────────────────────────────────── */}
        {wedding?.dress_code && (
          <section
            id="dress"
            className="bg-[#2b3a2e] text-[#f1ecdf] text-center px-6 sm:px-[90px] py-14 sm:py-[70px]"
          >
            <div className="text-[13px] tracking-[0.3em] uppercase text-[#c2a36b]">
              What to Wear
            </div>
            <h2
              className="font-medium text-4xl sm:text-5xl mt-2 mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {wedding.dress_code}
            </h2>
            {wedding.accommodations && (
              <p className="text-[17px] leading-[1.65] max-w-[540px] mx-auto mb-8 text-[#d8d3c2] whitespace-pre-line">
                {wedding.accommodations}
              </p>
            )}
            <div className="flex justify-center gap-4 sm:gap-[18px]">
              {DRESS_SWATCHES.map((s) => (
                <div key={s.name} className="text-center">
                  <div
                    className="w-[46px] h-[46px] rounded-full mx-auto mb-2"
                    style={{
                      background: s.color,
                      border: s.border ? "1px solid #5a6e54" : undefined,
                    }}
                  />
                  <div className="text-[11px] tracking-[0.12em] uppercase text-[#a9b29c]">
                    {s.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Additional sections ───────────────────────── */}
        {wedding?.sections && wedding.sections.length > 1 && (
          <div className="px-6 sm:px-[90px] py-12 sm:py-16 space-y-10">
            {wedding.sections.slice(1).map((section, i) => (
              <section key={i} className="max-w-[640px] mx-auto text-center">
                <h2
                  className="font-medium text-3xl sm:text-4xl text-warm-800 mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {section.title}
                </h2>
                <p className="text-warm-700 leading-[1.7] whitespace-pre-line text-[17px]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        )}

        {/* ── FAQ ───────────────────────────────────────── */}
        {wedding?.faqs && wedding.faqs.length > 0 && (
          <section className="px-6 sm:px-[90px] py-14 sm:py-[70px]">
            <div className="text-center mb-10 sm:mb-11">
              <div className="text-[13px] tracking-[0.3em] uppercase text-[var(--brass)]">
                Good to Know
              </div>
              <h2
                className="font-medium text-4xl sm:text-5xl mt-2 text-warm-800"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Questions
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-8 sm:gap-x-[50px] sm:gap-y-9 max-w-[700px] mx-auto">
              {wedding.faqs.map((f, i) => (
                <div key={i}>
                  <div
                    className="text-[23px] text-[var(--forest)] mb-1.5"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {f.question}
                  </div>
                  <p className="m-0 text-base leading-[1.6] text-warm-600 whitespace-pre-line">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── RSVP ──────────────────────────────────────── */}
        <section
          id="rsvp"
          className="bg-warm-100 px-6 sm:px-[90px] py-14 sm:py-[70px]"
        >
          <div className="max-w-[560px] mx-auto">
            <div className="text-center mb-9">
              <div className="text-[13px] tracking-[0.3em] uppercase text-[var(--brass)]">
                Join Us
              </div>
              <h2
                className="font-medium text-4xl sm:text-5xl mt-2 mb-1.5 text-warm-800"
                style={{ fontFamily: "var(--font-display)" }}
              >
                RSVP
              </h2>
              <p className="text-base text-warm-600 m-0">
                {wedding?.rsvp_deadline ? (
                  <>
                    Kindly reply by{" "}
                    <span className="text-[var(--brass)]">
                      {formatDeadline(wedding.rsvp_deadline)}
                    </span>
                    .
                  </>
                ) : (
                  "Please let us know if you can join us."
                )}
              </p>
              <p className="text-xs text-warm-500 mt-3">
                Already replied?{" "}
                <a
                  href="/rsvp/edit"
                  className="underline underline-offset-2 hover:text-[var(--brass)]"
                >
                  Edit your response →
                </a>
              </p>
            </div>
            <RsvpForm />
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────── */}
        <footer className="text-center py-14 bg-[#2b3a2e] text-[#d8d3c2]">
          <div
            className="text-3xl tracking-[0.3em] text-[#c2a36b]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {initials}
          </div>
          <p className="mt-3.5 text-[13px] tracking-[0.22em] uppercase">
            {names.length === 2
              ? `#${firstName}And${secondName}`.replace(/\s+/g, "")
              : "With love"}
            {wedding?.event_date &&
              ` · ${new Date(wedding.event_date)
                .toLocaleDateString("en-GB")
                .replace(/\//g, ".")}`}
          </p>
        </footer>
      </div>
    </div>
  );
}
