import { createECDH, randomBytes } from "crypto";
import webpush from "web-push";
import { expect, it } from "vitest";
import { vapidKeys } from "./push";

it("derives VAPID keys that web-push accepts", () => {
  const keys = vapidKeys()!;
  expect(Buffer.from(keys.publicKey, "base64url")).toHaveLength(65);
  const client = createECDH("prime256v1");
  client.generateKeys();
  const subscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/test",
    keys: { p256dh: client.getPublicKey().toString("base64url"), auth: randomBytes(16).toString("base64url") },
  };
  const details = webpush.generateRequestDetails(subscription, JSON.stringify({ title: "t" }), {
    vapidDetails: { subject: "mailto:hello@taskorb.app", ...keys },
  });
  expect(String(details.headers.Authorization)).toMatch(/^vapid t=/);
});
