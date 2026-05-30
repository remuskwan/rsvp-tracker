"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertTriangle, Download, ExternalLink, Link } from "lucide-react";

type Props = {
  url: string;
  source: "env" | "vercel" | "request-header" | "fallback";
  isLocal: boolean;
};

const SOURCE_LABEL: Record<Props["source"], string> = {
  env: "NEXT_PUBLIC_SITE_URL",
  vercel: "Vercel project URL",
  "request-header": "request host",
  fallback: "localhost fallback",
};

export function QrCodeDisplay({ url, source, isLocal }: Props) {
  const [pngDataUrl, setPngDataUrl] = useState<string>("");
  const [svgString, setSvgString] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      width: 600,
      margin: 2,
    }).then(setPngDataUrl);

    QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
    }).then(setSvgString);
  }, [url]);

  const downloadPng = () => {
    const link = document.createElement("a");
    link.download = "wedding-rsvp-qr.png";
    link.href = pngDataUrl;
    link.click();
  };

  const downloadSvg = () => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = "wedding-rsvp-qr.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6 max-w-sm">
      {isLocal && (
        <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-3 text-amber-900 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium">This QR points at a local URL.</p>
            <p className="mt-1">
              Set <code className="font-mono">NEXT_PUBLIC_SITE_URL</code> to your
              public domain before printing — scanned codes won&apos;t resolve on
              guest devices.
            </p>
          </div>
        </div>
      )}

      <div className="border border-stone-200 dark:border-stone-700 rounded-2xl p-6 bg-white dark:bg-stone-800 text-center">
        {pngDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pngDataUrl}
            alt="RSVP QR Code"
            className="mx-auto"
            style={{ imageRendering: "pixelated", width: 280, height: 280 }}
          />
        ) : (
          <div className="w-[280px] h-[280px] mx-auto bg-stone-100 dark:bg-stone-700 rounded animate-pulse" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-stone-400 shrink-0" />
          <span className="text-sm text-stone-600 dark:text-stone-300 break-all font-mono">
            {url}
          </span>
        </div>
        <p className="text-xs text-stone-400 pl-6">
          Base URL resolved from {SOURCE_LABEL[source]}.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={downloadSvg}
          disabled={!svgString}
          className="gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          Download SVG
        </Button>
        <Button
          onClick={downloadPng}
          disabled={!pngDataUrl}
          className="gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          Download PNG
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className={buttonVariants({ variant: "outline", className: "gap-2" })}
        >
          <ExternalLink className="h-4 w-4" />
          Test link
        </a>
      </div>

      <p className="text-xs text-stone-400">
        SVG is recommended for printing — it scales to any size without losing
        quality.
      </p>
    </div>
  );
}
