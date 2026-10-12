import { authed, json, readJson } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return authed(async (session) => {
    const body = await readJson(request);
    const board = await getRuntime().service.createBoardFromTemplate(session, body.slug, body.today, {
      name: body.name,
      color: body.color,
    });
    return json({ boardId: board.id }, 201);
  });
}
