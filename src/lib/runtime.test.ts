import { afterEach, describe, expect, it, vi } from "vitest";
import { firebaseWebConfig } from "./runtime";

describe("firebase web config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("signs in through the host the visitor is on when that host is allowed", () => {
    vi.stubEnv("FIREBASE_API_KEY", "key");
    vi.stubEnv("FIREBASE_PROJECT_ID", "demo");
    vi.stubEnv("FIREBASE_APP_ID", "app");
    vi.stubEnv("FIREBASE_AUTH_DOMAIN", "fallback.example");
    vi.stubEnv("AUTH_HOSTS", "taskorb.app, www.taskorb.app");
    expect(firebaseWebConfig("taskorb.app")?.authDomain).toBe("taskorb.app");
    expect(firebaseWebConfig("WWW.TaskOrb.app:443")?.authDomain).toBe("www.taskorb.app");
    expect(firebaseWebConfig("evil.example")?.authDomain).toBe("fallback.example");
    expect(firebaseWebConfig(null)?.authDomain).toBe("fallback.example");
  });
});
