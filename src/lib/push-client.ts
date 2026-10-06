import { api } from "./api-client";
import { isIOS, isNativeApp, isStandalone, nativePlatform } from "./native";

export type PushState = "unsupported" | "needs-install" | "denied" | "off" | "on";

type MessagingPlugin = {
  checkPermissions(): Promise<{ receive: string }>;
  requestPermissions(): Promise<{ receive: string }>;
  getToken(): Promise<{ token: string }>;
  deleteToken(): Promise<void>;
};

const TOKEN_KEY = "taskorb-native-push-token";

function messaging(): MessagingPlugin | null {
  const plugins = (window as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } }).Capacitor?.Plugins;
  return (plugins?.FirebaseMessaging as MessagingPlugin | undefined) ?? null;
}

function webSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

function keyBytes(base64url: string) {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export async function pushState(): Promise<PushState> {
  if (isNativeApp()) {
    const plugin = messaging();
    if (!plugin) return "unsupported";
    const { receive } = await plugin.checkPermissions();
    if (receive === "denied") return "denied";
    return receive === "granted" && localStorage.getItem(TOKEN_KEY) ? "on" : "off";
  }
  if (!webSupported()) return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const existing = await navigator.serviceWorker.getRegistration();
  const subscription = await existing?.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

export async function enablePush() {
  if (isNativeApp()) {
    const plugin = messaging();
    if (!plugin) throw new Error("Push notifications are not available in this build.");
    const { receive } = await plugin.requestPermissions();
    if (receive !== "granted") throw new Error("Notifications were not allowed.");
    const { token } = await plugin.getToken();
    await api("/api/push", { method: "POST", body: JSON.stringify({ kind: "fcm", token, platform: nativePlatform() }) });
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications were not allowed.");
  const { publicKey } = await api<{ publicKey: string | null }>("/api/push");
  if (!publicKey) throw new Error("Push notifications are not set up on the server yet.");
  const worker = await registration();
  const subscription =
    (await worker.pushManager.getSubscription()) ??
    (await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
  await api("/api/push", { method: "POST", body: JSON.stringify({ kind: "web", subscription: subscription.toJSON() }) });
}

export async function disablePush() {
  if (isNativeApp()) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) await api("/api/push", { method: "DELETE", body: JSON.stringify({ token }) });
    await messaging()?.deleteToken();
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  const existing = await navigator.serviceWorker.getRegistration();
  const subscription = await existing?.pushManager.getSubscription();
  if (!subscription) return;
  await api("/api/push", { method: "DELETE", body: JSON.stringify({ endpoint: subscription.endpoint }) });
  await subscription.unsubscribe();
}
