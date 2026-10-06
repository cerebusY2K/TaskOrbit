import { authed, json } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  return authed(async (session) => {
    const origin = process.env.APP_URL || new URL(request.url).origin;
    return json(await getRuntime().service.boardInvite(session, id, origin));
  });
}
