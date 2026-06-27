import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { RsvpForm } from "@/components/rsvp-form";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

export default async function RsvpPage() {
  const supabase = await createClient();
  const { data: info } = await supabase
    .from("wedding_info")
    .select("couple_names, rsvp_deadline")
    .eq("id", 1)
    .single();

  const coupleNames = info?.couple_names ?? "The Happy Couple";
  const deadline = info?.rsvp_deadline
    ? new Date(info.rsvp_deadline).toLocaleDateString("en-SG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-warm-800 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to wedding details
        </Link>

        <div className="text-center mb-10">
          <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-warm-200 shadow-sm">
            <Image
              src="/rsvp.jpeg"
              alt="Wedding couple"
              fill
              sizes="128px"
              className="object-cover"
              priority
            />
          </div>
          <h1
            className="text-4xl text-warm-800 mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            RSVP
          </h1>
          <p className="text-warm-500 text-sm">
            for the wedding of{" "}
            <span className="font-medium text-warm-700">{coupleNames}</span>
          </p>
          {deadline && (
            <p className="text-warm-400 text-xs mt-1">
              Kindly respond by {deadline}
            </p>
          )}
        </div>

        <p className="text-xs text-warm-400 mb-4 text-center">
          Already RSVPed?{" "}
          <Link href="/rsvp/edit" className="underline underline-offset-2 hover:text-warm-700">
            Edit your response →
          </Link>
        </p>
        <div className="bg-card rounded-2xl shadow-sm border border-warm-200 p-6 md:p-8">
          <RsvpForm />
        </div>
      </div>
    </div>
  );
}
