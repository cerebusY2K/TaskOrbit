import { createHash } from "crypto";

export type VisitInput = {
  path: unknown;
  referrer: unknown;
  source: unknown;
  utm: unknown;
  userAgent: string;
  country: string | null;
  host: string | null;
  signedIn: boolean;
  visitorId: string;
  secret: string;
  now?: Date;
};

export type VisitEvent = {
  day: string;
  visitor: string;
  path: string;
  referrer: string;
  country: string;
  device: string;
  source: string;
  signedIn: boolean;
};

export type Breakdown = Record<string, number>;

export type DayStats = {
  day: string;
  views: number;
  visitors: number;
  newVisitors: number;
  signedInViews: number;
  paths: Breakdown;
  referrers: Breakdown;
  countries: Breakdown;
  devices: Breakdown;
  sources: Breakdown;
};

export type AppTotals = {
  users: number;
  boards: number;
  cards: number;
  tasks: number;
  signupDates: string[];
};

export interface AnalyticsStore {
  record(event: VisitEvent): Promise<void>;
  days(from: string, to: string): Promise<DayStats[]>;
  totals(signupsSince: string): Promise<AppTotals>;
}

export const BREAKDOWNS = ["paths", "referrers", "countries", "devices", "sources"] as const;
export type BreakdownName = (typeof BREAKDOWNS)[number];

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|render/i;

export function isBot(userAgent: string) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function deviceOf(userAgent: string) {
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/iPhone|iPod/i.test(userAgent)) return "iPhone";
  if (/Android/i.test(userAgent)) return /Mobile/i.test(userAgent) ? "Android phone" : "Android tablet";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/CrOS/i.test(userAgent)) return "Chromebook";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Other";
}

const SOURCES: Record<string, string> = {
  ios: "iPhone app",
  android: "Android app",
  installed: "Installed web app",
  web: "Browser",
};

export function sourceOf(source: unknown) {
  return (typeof source === "string" && SOURCES[source]) || "Browser";
}

const REFERRER_NAMES: Array<[RegExp, string]> = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)yahoo\./, "Yahoo"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "X / Twitter"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn"],
  [/(^|\.)(facebook\.com|fb\.com|l\.facebook\.com)$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)news\.ycombinator\.com$/, "Hacker News"],
  [/(^|\.)producthunt\.com$/, "Product Hunt"],
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(slack\.com|slack-redir\.net)$/, "Slack"],
  [/(^|\.)chatgpt\.com$/, "ChatGPT"],
];

export function referrerOf(referrer: unknown, utm: unknown, ownHost: string | null) {
  if (typeof utm === "string" && utm.trim()) return clip(utm.trim().toLowerCase(), 60);
  if (typeof referrer !== "string" || !referrer) return "Direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "Direct";
  }
  const own = ownHost?.split(":")[0]?.toLowerCase().replace(/^www\./, "");
  if (!host || host === own || host.endsWith("firebaseapp.com") || host.endsWith("onrender.com")) {
    return "Direct";
  }
  return REFERRER_NAMES.find(([pattern]) => pattern.test(host))?.[1] ?? clip(host, 60);
}

export function pathOf(path: unknown) {
  if (typeof path !== "string" || !path.startsWith("/")) return "/";
  const clean = path.split(/[?#]/)[0]!;
  if (clean.startsWith("/invite/")) return "/invite";
  return clip(clean, 80) || "/";
}

export function countryOf(country: string | null) {
  const code = country?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1" ? code : "Unknown";
}

export function dayOf(date: Date, timeZone = process.env.ANALYTICS_TIMEZONE || "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function shiftDay(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function visitorHash(visitorId: string, secret: string) {
  return createHash("sha256").update(`${secret}:${visitorId}`).digest("hex").slice(0, 32);
}

export function visitEvent(input: VisitInput): VisitEvent | null {
  if (isBot(input.userAgent)) return null;
  return {
    day: dayOf(input.now ?? new Date()),
    visitor: visitorHash(input.visitorId, input.secret),
    path: pathOf(input.path),
    referrer: referrerOf(input.referrer, input.utm, input.host),
    country: countryOf(input.country),
    device: deviceOf(input.userAgent),
    source: sourceOf(input.source),
    signedIn: input.signedIn,
  };
}

export function emptyDay(day: string): DayStats {
  return {
    day,
    views: 0,
    visitors: 0,
    newVisitors: 0,
    signedInViews: 0,
    paths: {},
    referrers: {},
    countries: {},
    devices: {},
    sources: {},
  };
}

export function eventBreakdowns(event: VisitEvent): Record<BreakdownName, string> {
  return {
    paths: event.path,
    referrers: event.referrer,
    countries: event.country,
    devices: event.device,
    sources: event.source,
  };
}

export function applyEvent(stats: DayStats, event: VisitEvent, firstToday: boolean, firstEver: boolean) {
  stats.views += 1;
  if (firstToday) stats.visitors += 1;
  if (firstEver) stats.newVisitors += 1;
  if (event.signedIn) stats.signedInViews += 1;
  const keys = eventBreakdowns(event);
  for (const name of BREAKDOWNS) {
    stats[name][keys[name]] = (stats[name][keys[name]] ?? 0) + 1;
  }
  return stats;
}

export function fillDays(stats: DayStats[], from: string, to: string) {
  const byDay = new Map(stats.map((item) => [item.day, item]));
  const out: DayStats[] = [];
  for (let day = from; day <= to; day = shiftDay(day, 1)) {
    out.push(byDay.get(day) ?? emptyDay(day));
  }
  return out;
}

export function sumDays(days: DayStats[]) {
  const total = emptyDay(days[0]?.day ?? "");
  for (const day of days) {
    total.views += day.views;
    total.visitors += day.visitors;
    total.newVisitors += day.newVisitors;
    total.signedInViews += day.signedInViews;
    for (const name of BREAKDOWNS) {
      for (const [key, count] of Object.entries(day[name])) {
        total[name][key] = (total[name][key] ?? 0) + count;
      }
    }
  }
  return total;
}

export function topEntries(breakdown: Breakdown, limit = 8) {
  return Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

export function adminEmailAllowed(email: string | null | undefined) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const listed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (listed.length > 0) return listed.includes(normalized);
  return DEFAULT_ADMIN_HASHES.includes(createHash("sha256").update(normalized).digest("hex"));
}

// Used only when ADMIN_EMAILS is unset; hashed so the address isn't published with the source.
const DEFAULT_ADMIN_HASHES = ["87febfabdc6689a29e33ff30d7cd40e2a2411acb6e4ece8f80e3bd4e8062b2cf"];

function clip(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}
