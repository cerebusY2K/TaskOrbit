import { authed, json, readJson } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return authed(async (session) => {
    const body = await readJson(request);
    if (typeof body.id === "string" && body.id) {
      await getRuntime().service.markNotificationRead(session, body.id);
    } else {
      await getRuntime().service.markAllNotificationsRead(session);
    }
    return json({ ok: true });
  });
}
