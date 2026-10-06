import { authed, json, readJson } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return authed(async (session) => {
    const body = await readJson(request);
    return json(await getRuntime().service.createDependency(session, body), 201);
  });
}
