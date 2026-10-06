import { authed, json, readJson } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return authed(async () => json({ publicKey: getRuntime().service.pushPublicKey() }));
}

export async function POST(request: Request) {
  return authed(async (session) => {
    const body = await readJson(request);
    return json(await getRuntime().service.registerPush(session, body), 201);
  });
}

export async function DELETE(request: Request) {
  return authed(async (session) => {
    const body = await readJson(request);
    await getRuntime().service.unregisterPush(session, body);
    return json({ ok: true });
  });
}
