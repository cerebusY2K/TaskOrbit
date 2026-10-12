import { BoardError } from "@/lib/errors";
import { authed, json, readJson } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 3_000_000;

export async function POST(request: Request) {
  return authed(async (session) => {
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) {
      throw new BoardError("That import is too large. Try a smaller board.", 413);
    }
    const body = await readJson(request);
    return json(await getRuntime().service.importBoard(session, body), 201);
  });
}
