import { requireAdmin } from "@/lib/supabase/admin-guard";
import { QrCodeDisplay } from "@/components/qr-code-display";
import { getSiteUrl, QR_REDIRECT_PATH, RSVP_PATH } from "@/lib/site-url";

export default async function QrPage() {
  await requireAdmin();

  const { baseUrl, source, isLocal } = await getSiteUrl();
  const qrUrl = `${baseUrl}${QR_REDIRECT_PATH}`;
  const destinationUrl = `${baseUrl}${RSVP_PATH}`;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
          QR Code
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Print this on your invitations. Scanning it opens your RSVP form.
        </p>
      </div>
      <QrCodeDisplay
        url={qrUrl}
        destinationUrl={destinationUrl}
        source={source}
        isLocal={isLocal}
      />
    </div>
  );
}
