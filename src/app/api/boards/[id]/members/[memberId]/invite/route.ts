import { authed, json } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; memberId: string }> };

export async function POST(_request: Request, context: Context) {
  const { id, memberId } = await context.params;
  return authed(async (session) => json(await getRuntime().service.resendMemberInvite(session, id, memberId)));
}
