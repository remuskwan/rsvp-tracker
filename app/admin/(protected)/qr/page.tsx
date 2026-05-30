import { requireAdmin } from "@/lib/supabase/admin-guard";
import { QrCodeDisplay } from "@/components/qr-code-display";
import { getSiteUrl } from "@/lib/site-url";

export default async function QrPage() {
  await requireAdmin();

  const { baseUrl, source, isLocal } = await getSiteUrl();

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
          QR Code
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Print this on your invitations. Scanning it opens the wedding page.
        </p>
      </div>
      <QrCodeDisplay url={baseUrl} source={source} isLocal={isLocal} />
    </div>
  );
}
