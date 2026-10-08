import { json } from "@/lib/http";
import { publicConfig } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return json(publicConfig(request.headers.get("x-forwarded-host") ?? request.headers.get("host")));
}
