import { json } from "@/lib/http";
import { dataMode, firebaseWebConfig } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const mode = dataMode();
  const firebase = firebaseWebConfig();
  return json({
    mode,
    firebase,
    message: firebase ? null : "Google sign-in is not configured on this server yet.",
  });
}
