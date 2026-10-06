import { json } from "@/lib/http";
import { dataMode, firebaseWebConfig } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const mode = dataMode();
  const firebase = firebaseWebConfig(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  return json({
    mode,
    firebase,
    message: firebase ? null : "Google sign-in is not configured on this server yet.",
  });
}
