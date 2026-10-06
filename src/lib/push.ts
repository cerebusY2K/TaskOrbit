import { createECDH, createHmac } from "crypto";
import { getMessaging } from "firebase-admin/messaging";
import webpush from "web-push";
import { firebaseAdminConfigured, getAdminApp } from "./firestore-store";
import type { PushDevice } from "./types";

export type PushMessage = { title: string; body: string; url: string };

export type Pusher = {
  publicKey: string | null;
  send(devices: PushDevice[], message: PushMessage): Promise<string[]>;
};

export function vapidKeys() {
  const explicit = process.env.VAPID_PRIVATE_KEY;
  const secret =
    process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-only-session-secret");
  if (!explicit && !secret) return null;
  const privateKey = explicit
    ? Buffer.from(explicit, "base64url")
    : createHmac("sha256", secret).update("taskorb-web-push").digest();
  try {
    const curve = createECDH("prime256v1");
    curve.setPrivateKey(privateKey);
    return { publicKey: curve.getPublicKey().toString("base64url"), privateKey: privateKey.toString("base64url") };
  } catch {
    return null;
  }
}

function errorCode(error: unknown) {
  const value = error as { statusCode?: number; code?: string; errorInfo?: { code?: string } };
  return { status: value.statusCode, code: value.code ?? value.errorInfo?.code };
}

export function createPusher(appUrl: string): Pusher {
  const keys = vapidKeys();
  const subject = appUrl.startsWith("https://") ? appUrl : "mailto:hello@taskorb.app";
  return {
    publicKey: keys?.publicKey ?? null,
    async send(devices, message) {
      const dead: string[] = [];
      await Promise.all(
        devices.map(async (device) => {
          try {
            if (device.kind === "web" && device.endpoint && device.keys && keys) {
              await webpush.sendNotification(
                { endpoint: device.endpoint, keys: device.keys },
                JSON.stringify(message),
                { vapidDetails: { subject, ...keys }, TTL: 60 * 60 * 24 },
              );
            } else if (device.kind === "fcm" && device.token && firebaseAdminConfigured()) {
              await getMessaging(getAdminApp()).send({
                token: device.token,
                notification: { title: message.title, body: message.body },
                data: { url: message.url },
                apns: { payload: { aps: { sound: "default" } } },
              });
            }
          } catch (error) {
            const { status, code } = errorCode(error);
            if (
              status === 404 ||
              status === 410 ||
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              dead.push(device.id);
            }
          }
        }),
      );
      return dead;
    },
  };
}
