import { headers } from "next/headers";

export const RSVP_PATH = "/rsvp";
export const QR_REDIRECT_PATH = "/r";

export type SiteUrlSource =
  | "env"
  | "vercel"
  | "request-header"
  | "fallback";

export type SiteUrl = {
  baseUrl: string;
  source: SiteUrlSource;
  isLocal: boolean;
};

function normalize(input: string): string {
  const trimmed = input.replace(/\/+$/, "");
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function getSiteUrl(): Promise<SiteUrl> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    const baseUrl = normalize(envUrl);
    return { baseUrl, source: "env", isLocal: isLocalUrl(baseUrl) };
  }

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) {
    const baseUrl = normalize(vercelHost);
    return { baseUrl, source: "vercel", isLocal: false };
  }

  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host");
  const host = forwardedHost ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (isLocalHost(host) ? "http" : "https");
    const baseUrl = `${proto}://${host.replace(/\/+$/, "")}`;
    return { baseUrl, source: "request-header", isLocal: isLocalHost(host) };
  }

  return {
    baseUrl: "http://localhost:3000",
    source: "fallback",
    isLocal: true,
  };
}

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.startsWith("localhost") ||
    h.startsWith("127.0.0.1") ||
    h.startsWith("0.0.0.0") ||
    h.endsWith(".local")
  );
}

function isLocalUrl(url: string): boolean {
  try {
    return isLocalHost(new URL(url).host);
  } catch {
    return false;
  }
}
