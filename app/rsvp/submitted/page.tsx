import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default async function SubmittedPage() {
  const supabase = await createClient();
  const { data: info } = await supabase
    .from("wedding_info")
    .select("couple_names")
    .eq("id", 1)
    .single();

  const coupleNames = info?.couple_names ?? "The Happy Couple";

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Heart className="h-12 w-12 text-rose-400 fill-rose-400" />
        </div>
        <h1
          className="text-4xl text-stone-800 mb-4"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Thank You!
        </h1>
        <p className="text-stone-600 mb-2">
          Your RSVP has been received.
        </p>
        <p className="text-stone-500 text-sm mb-8">
          {coupleNames} are so excited to celebrate with you. See you soon!
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-full px-8">
            Back to wedding details
          </Button>
        </Link>
      </div>
    </div>
  );
}
