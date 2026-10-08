import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import {
  applyEvent,
  BREAKDOWNS,
  emptyDay,
  eventBreakdowns,
  type AnalyticsStore,
  type AppTotals,
  type Breakdown,
  type DayStats,
  type VisitEvent,
} from "./analytics";
import { firestoreDb } from "./firestore-store";
import { dataMode, getRuntime } from "./runtime";
import type { MemoryStore, StoreSnapshot } from "./store";

// Firestore map keys can't contain dots, and paths and hosts usually do.
const encodeKey = (key: string) => encodeURIComponent(key).replace(/\./g, "%2E");
const decodeKey = (key: string) => {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
};

function decodeBreakdown(value: unknown): Breakdown {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, count]) => typeof count === "number")
      .map(([key, count]) => [decodeKey(key), count as number]),
  );
}

async function createOnce(ref: DocumentReference, data: Record<string, unknown>) {
  try {
    await ref.create(data);
    return true;
  } catch (error) {
    if ((error as { code?: number }).code === 6) return false;
    throw error;
  }
}

export class FirestoreAnalytics implements AnalyticsStore {
  private collection(name: string) {
    return firestoreDb().collection(name);
  }

  async record(event: VisitEvent) {
    const at = new Date().toISOString();
    const firstToday = await createOnce(this.collection("analyticsVisitorDays").doc(`${event.day}_${event.visitor}`), {
      day: event.day,
      at,
    });
    const firstEver =
      firstToday && (await createOnce(this.collection("analyticsVisitors").doc(event.visitor), { firstDay: event.day, at }));
    const increment = FieldValue.increment(1);
    const update: Record<string, unknown> = { day: event.day, views: increment };
    if (firstToday) update.visitors = increment;
    if (firstEver) update.newVisitors = increment;
    if (event.signedIn) update.signedInViews = increment;
    const keys = eventBreakdowns(event);
    for (const name of BREAKDOWNS) update[name] = { [encodeKey(keys[name])]: increment };
    await this.collection("analyticsDays").doc(event.day).set(update, { merge: true });
  }

  async days(from: string, to: string) {
    const snap = await this.collection("analyticsDays").where("day", ">=", from).where("day", "<=", to).get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      const stats = emptyDay(String(data.day ?? doc.id));
      stats.views = Number(data.views ?? 0);
      stats.visitors = Number(data.visitors ?? 0);
      stats.newVisitors = Number(data.newVisitors ?? 0);
      stats.signedInViews = Number(data.signedInViews ?? 0);
      for (const name of BREAKDOWNS) stats[name] = decodeBreakdown(data[name]);
      return stats;
    });
  }

  async totals(signupsSince: string): Promise<AppTotals> {
    const count = async (name: string) => (await this.collection(name).count().get()).data().count;
    const [users, boards, cards, tasks, signups] = await Promise.all([
      count("users"),
      count("boards"),
      count("cards"),
      count("dependencies"),
      this.collection("users").where("createdAt", ">=", signupsSince).select("createdAt").get(),
    ]);
    return {
      users,
      boards,
      cards,
      tasks,
      signupDates: signups.docs.map((doc) => String(doc.data().createdAt ?? "")),
    };
  }
}

type FileSnapshot = { days: DayStats[]; visitorDays: string[]; visitors: string[] };

export class FileAnalytics implements AnalyticsStore {
  constructor(
    private file: string,
    private snapshot: () => StoreSnapshot,
  ) {}

  private read(): FileSnapshot {
    if (!existsSync(this.file)) return { days: [], visitorDays: [], visitors: [] };
    return JSON.parse(readFileSync(this.file, "utf8")) as FileSnapshot;
  }

  async record(event: VisitEvent) {
    const data = this.read();
    const dayKey = `${event.day}_${event.visitor}`;
    const firstToday = !data.visitorDays.includes(dayKey);
    const firstEver = firstToday && !data.visitors.includes(event.visitor);
    if (firstToday) data.visitorDays.push(dayKey);
    if (firstEver) data.visitors.push(event.visitor);
    let stats = data.days.find((item) => item.day === event.day);
    if (!stats) {
      stats = emptyDay(event.day);
      data.days.push(stats);
    }
    applyEvent(stats, event, firstToday, firstEver);
    mkdirSync(path.dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(data, null, 2));
  }

  async days(from: string, to: string) {
    return this.read().days.filter((item) => item.day >= from && item.day <= to);
  }

  async totals(signupsSince: string): Promise<AppTotals> {
    const snapshot = this.snapshot();
    return {
      users: snapshot.users.length,
      boards: snapshot.boards?.length ?? 0,
      cards: snapshot.cards.length,
      tasks: snapshot.dependencies.length,
      signupDates: snapshot.users.map((user) => user.createdAt).filter((at) => at >= signupsSince),
    };
  }
}

let firestoreAnalytics: FirestoreAnalytics | null = null;

export function getAnalytics(): AnalyticsStore | null {
  const mode = dataMode();
  if (mode === "firebase") return (firestoreAnalytics ??= new FirestoreAnalytics());
  if (mode === "local") {
    return new FileAnalytics(path.join(process.cwd(), "data", "analytics.json"), () =>
      (getRuntime().store as MemoryStore).dump(),
    );
  }
  return null;
}
