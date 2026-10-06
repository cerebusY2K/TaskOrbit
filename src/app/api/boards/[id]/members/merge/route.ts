import { authed, json, readJson } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  return authed(async (session) => {
    const body = await readJson(request);
    return json(await getRuntime().service.mergeMember(session, id, body));
  });
}
