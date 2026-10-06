import { fail, json, readJson } from "@/lib/http";
import { verifyFirebaseToken } from "@/lib/firestore-store";
import { firebaseWebConfig, getRuntime } from "@/lib/runtime";
import { setSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!firebaseWebConfig()) {
      return json({ error: "Google sign-in is not configured yet." }, 400);
    }
    const body = await readJson(request);
    if (typeof body.idToken !== "string" || !body.idToken) {
      return json({ error: "Missing sign-in token." }, 400);
    }
    const verified = await verifyFirebaseToken(body.idToken);
    if (!verified.email) {
      return json({ error: "Google did not share an email address for this account." }, 400);
    }
    const user = await getRuntime().service.signIn({
      uid: verified.uid,
      email: verified.email,
      name: verified.name || verified.email.split("@")[0],
      photoURL: verified.photoURL,
    });
    await setSession({
      uid: user.uid,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
    });
    return json({ user });
  } catch (error) {
    return fail(error);
  }
}
