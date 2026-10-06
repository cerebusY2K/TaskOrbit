import { authed, fail, json } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Context) {
  const { token } = await context.params;
  try {
    return json(await getRuntime().service.previewInvite(decodeURIComponent(token)));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(_request: Request, context: Context) {
  const { token } = await context.params;
  return authed(async (session) =>
    json(await getRuntime().service.acceptInvite(session, decodeURIComponent(token))),
  );
}
