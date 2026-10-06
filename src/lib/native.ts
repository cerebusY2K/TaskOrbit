type NativeAuth = {
  signInWithGoogle(): Promise<unknown>;
  getIdToken(): Promise<{ token: string }>;
  signOut(): Promise<void>;
};

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: { FirebaseAuthentication?: NativeAuth };
};

function capacitor(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNativeApp() {
  return Boolean(capacitor()?.isNativePlatform?.());
}

export function nativePlatform() {
  return isNativeApp() ? (capacitor()?.getPlatform?.() ?? "web") : "web";
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    isNativeApp() ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export async function nativeGoogleIdToken() {
  const auth = capacitor()?.Plugins?.FirebaseAuthentication;
  if (!auth) throw new Error("Google sign-in is not available in this version of the app.");
  await auth.signInWithGoogle();
  const { token } = await auth.getIdToken();
  return token;
}

export async function nativeSignOut() {
  if (!isNativeApp()) return;
  await capacitor()?.Plugins?.FirebaseAuthentication?.signOut().catch(() => undefined);
}
