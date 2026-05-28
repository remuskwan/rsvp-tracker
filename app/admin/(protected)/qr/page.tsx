import { requireAdmin } from "@/lib/supabase/admin-guard";
import { QrCodeDisplay } from "@/components/qr-code-display";

export default async function QrPage() {
  await requireAdmin();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const rsvpUrl = `${siteUrl}/rsvp`;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">QR Code</h1>
        <p className="text-sm text-stone-500 mt-1">
          Print this on your invitations. Scanning it opens your RSVP form.
        </p>
      </div>
      <QrCodeDisplay url={rsvpUrl} />
    </div>
  );
}
