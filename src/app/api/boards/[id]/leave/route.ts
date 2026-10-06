import { authed, json } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;
  return authed(async (session) => {
    await getRuntime().service.leaveBoard(session, id);
    return json({ ok: true });
  });
}
