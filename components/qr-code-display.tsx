"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Link } from "lucide-react";

export function QrCodeDisplay({ url }: { url: string }) {
  const [pngDataUrl, setPngDataUrl] = useState<string>("");
  const [svgString, setSvgString] = useState<string>("");

  useEffect(() => {
    // Generate PNG
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      width: 600,
      margin: 2,
    }).then(setPngDataUrl);

    // Generate SVG
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
      {/* QR Preview */}
      <div className="border border-stone-200 rounded-2xl p-6 bg-white text-center">
        {pngDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pngDataUrl}
            alt="RSVP QR Code"
            className="mx-auto"
            style={{ imageRendering: "pixelated", width: 280, height: 280 }}
          />
        ) : (
          <div className="w-[280px] h-[280px] mx-auto bg-stone-100 rounded animate-pulse" />
        )}
        <p className="text-xs text-stone-400 mt-3 break-all">{url}</p>
      </div>

      {/* URL copy */}
      <div className="flex items-center gap-2">
        <Link className="h-4 w-4 text-stone-400 shrink-0" />
        <span className="text-sm text-stone-600 break-all">{url}</span>
      </div>

      {/* Downloads */}
      <div className="flex gap-3">
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
      </div>

      <p className="text-xs text-stone-400">
        SVG is recommended for printing — it scales to any size without losing
        quality.
      </p>
    </div>
  );
}
