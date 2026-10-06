import { authed, json, readJson } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  return authed(async (session) => {
    const body = await readJson(request);
    return json(await getRuntime().service.updateBoard(session, id, body));
  });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  return authed(async (session) => {
    await getRuntime().service.deleteBoard(session, id);
    return json({ ok: true });
  });
}
