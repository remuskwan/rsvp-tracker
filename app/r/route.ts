import { NextResponse } from "next/server";
import { RSVP_PATH } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const target = new URL(RSVP_PATH, request.url);
  return NextResponse.redirect(target, 307);
}
