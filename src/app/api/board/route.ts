import { authed, json } from "@/lib/http";
import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return authed(async (session) => json(await getRuntime().service.board(session)));
}
