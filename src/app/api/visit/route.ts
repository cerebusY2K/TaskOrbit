import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { visitEvent } from "@/lib/analytics";
import { getAnalytics } from "@/lib/analytics-store";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "taskorb_vid";

export async function POST(request: Request) {
  const response = new NextResponse(null, { status: 204 });
  try {
    const analytics = getAnalytics();
    if (!analytics) return response;
    let body: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(await request.text());
      if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
    } catch {
      return response;
    }
    const jar = await cookies();
    let visitorId = jar.get(VISITOR_COOKIE)?.value;
    if (!visitorId || visitorId.length > 64) {
      visitorId = randomUUID();
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 400,
      });
    }
    const event = visitEvent({
      path: body.path,
      referrer: body.referrer,
      source: body.source,
      utm: body.utm,
      userAgent: request.headers.get("user-agent") ?? "",
      country: request.headers.get("cf-ipcountry") ?? request.headers.get("x-vercel-ip-country"),
      host: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
      signedIn: Boolean(await getSession()),
      visitorId,
      secret: process.env.SESSION_SECRET || "dev-only-session-secret",
    });
    if (event) await analytics.record(event);
  } catch (error) {
    console.error("visit tracking failed", error);
  }
  return response;
}
