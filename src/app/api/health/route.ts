import { json } from "@/lib/http";
import { dataMode } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json({ ok: true, mode: dataMode() });
}
