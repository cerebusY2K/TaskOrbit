import { adminEmailAllowed } from "@/lib/analytics";
import { authed, json } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return authed(async (session) => {
    const payload = await getRuntime().service.board(session);
    return json(adminEmailAllowed(session.email) ? { ...payload, isAdmin: true } : payload);
  });
}
