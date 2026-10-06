import { initializeApp, getApps, getApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
} from "firebase/auth";
import type { PublicConfig } from "./api-client";

export function clientAuth(config: NonNullable<PublicConfig["firebase"]>): Auth {
  const app = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}

export function warmAuth(auth: Auth) {
  return auth.authStateReady();
}

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function authCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String(error.code) : "";
}

let redirectToken: Promise<string | null> | null = null;

export function consumeGoogleRedirect(auth: Auth) {
  redirectToken ??= getRedirectResult(auth).then((result) => result?.user.getIdToken() ?? null);
  return redirectToken;
}

export async function googleIdToken(auth: Auth) {
  const provider = googleProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user.getIdToken();
  } catch (error) {
    if (!authCode(error).includes("popup-blocked")) throw error;
    await signInWithRedirect(auth, provider);
    return null;
  }
}

export async function clientSignOut(auth: Auth) {
  await signOut(auth);
}

export function friendlyAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code.includes("unauthorized-domain")) {
    return "This domain is not authorized in Firebase yet. Add it under Authentication, Settings, Authorized domains.";
  }
  if (code.includes("popup-blocked")) {
    return "The sign-in window was blocked. Click Continue with Google again.";
  }
  if (code.includes("popup-closed") || code.includes("cancelled")) {
    return "Sign-in was closed before it finished.";
  }
  if (code.includes("account-exists-with-different-credential")) {
    return "That email is already registered with a different sign-in method.";
  }
  return error instanceof Error ? error.message : "Sign-in failed.";
}
