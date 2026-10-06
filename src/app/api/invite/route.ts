import { authed, json } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return authed(async (session) => {
    const origin = process.env.APP_URL || new URL(request.url).origin;
    return json(await getRuntime().service.inviteLink(session, origin));
  });
}
