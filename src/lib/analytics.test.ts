import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  adminEmailAllowed,
  dayOf,
  fillDays,
  pathOf,
  referrerOf,
  sumDays,
  topEntries,
  visitEvent,
  type VisitInput,
} from "./analytics";
import { FileAnalytics } from "./analytics-store";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

function input(overrides: Partial<VisitInput> = {}): VisitInput {
  return {
    path: "/",
    referrer: null,
    source: "web",
    utm: null,
    userAgent: CHROME_MAC,
    country: "IN",
    host: "taskorb.app",
    signedIn: false,
    visitorId: "visitor-1",
    secret: "secret",
    now: new Date("2026-10-08T10:00:00Z"),
    ...overrides,
  };
}

describe("visit events", () => {
  it("describes a visit without storing the raw visitor id", () => {
    const event = visitEvent(input({ referrer: "https://www.google.com/search?q=taskorb", source: "installed" }))!;
    expect(event).toMatchObject({
      day: "2026-10-08",
      path: "/",
      referrer: "Google",
      country: "IN",
      device: "Mac",
      source: "Installed web app",
      signedIn: false,
    });
    expect(event.visitor).not.toContain("visitor-1");
    expect(visitEvent(input())!.visitor).toBe(event.visitor);
    expect(visitEvent(input({ visitorId: "visitor-2" }))!.visitor).not.toBe(event.visitor);
  });

  it("ignores bots and crawlers", () => {
    expect(visitEvent(input({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" }))).toBeNull();
    expect(visitEvent(input({ userAgent: "curl/8.7.1" }))).toBeNull();
    expect(visitEvent(input({ userAgent: "" }))).toBeNull();
  });

  it("names referrers and treats our own pages as direct", () => {
    expect(referrerOf("https://taskorb.app/?board=1", null, "taskorb.app")).toBe("Direct");
    expect(referrerOf("https://www.linkedin.com/feed", null, "taskorb.app")).toBe("LinkedIn");
    expect(referrerOf("https://blog.example.com/post", null, "taskorb.app")).toBe("blog.example.com");
    expect(referrerOf("https://t.co/abc", "Newsletter", "taskorb.app")).toBe("newsletter");
    expect(referrerOf("not a url", null, "taskorb.app")).toBe("Direct");
  });

  it("keeps invite tokens and query strings out of page paths", () => {
    expect(pathOf("/invite/secret-token")).toBe("/invite");
    expect(pathOf("/?board=abc#x")).toBe("/");
    expect(pathOf("https://evil.example")).toBe("/");
  });

  it("buckets days in India time by default", () => {
    expect(dayOf(new Date("2026-10-08T20:00:00Z"))).toBe("2026-10-09");
    expect(dayOf(new Date("2026-10-08T20:00:00Z"), "UTC")).toBe("2026-10-08");
  });
});

describe("admin access", () => {
  const previous = process.env.ADMIN_EMAILS;
  afterEach(() => {
    process.env.ADMIN_EMAILS = previous;
  });

  it("only lets listed emails in", () => {
    process.env.ADMIN_EMAILS = "boss@example.com, other@example.com";
    expect(adminEmailAllowed("Boss@Example.com")).toBe(true);
    expect(adminEmailAllowed("someone@example.com")).toBe(false);
    expect(adminEmailAllowed(null)).toBe(false);
  });
});

describe("file analytics", () => {
  it("counts views, daily visitors and first-time visitors", async () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "taskorb-analytics-")), "analytics.json");
    const store = new FileAnalytics(file, () => ({
      users: [],
      cards: [],
      dependencies: [],
      notifications: [],
      pending: [],
      invites: [],
      outbox: [],
    }));
    const day1 = new Date("2026-10-07T06:00:00Z");
    const day2 = new Date("2026-10-08T06:00:00Z");
    await store.record(visitEvent(input({ now: day1 }))!);
    await store.record(visitEvent(input({ now: day1, path: "/invite/x" }))!);
    await store.record(visitEvent(input({ now: day1, visitorId: "v2", userAgent: SAFARI_IPHONE, country: "US" }))!);
    await store.record(visitEvent(input({ now: day2, signedIn: true }))!);

    const days = fillDays(await store.days("2026-10-06", "2026-10-08"), "2026-10-06", "2026-10-08");
    expect(days.map((day) => [day.day, day.views, day.visitors, day.newVisitors])).toEqual([
      ["2026-10-06", 0, 0, 0],
      ["2026-10-07", 3, 2, 2],
      ["2026-10-08", 1, 1, 0],
    ]);
    const total = sumDays(days);
    expect(total.signedInViews).toBe(1);
    expect(topEntries(total.paths)).toEqual([
      ["/", 3],
      ["/invite", 1],
    ]);
    expect(total.devices).toEqual({ Mac: 3, iPhone: 1 });
    expect(total.countries).toEqual({ IN: 3, US: 1 });
  });
});
