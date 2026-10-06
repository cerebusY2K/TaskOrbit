import { mkdirSync, readFileSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { BoardService } from "./board-service";
import { BoardError } from "./errors";
import { firebaseAdminConfigured, FirestoreStore } from "./firestore-store";
import { MemoryStore, type StoreSnapshot } from "./store";

export type DataMode = "firebase" | "local" | "unconfigured";

function authHosts() {
  return (process.env.AUTH_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export function firebaseWebConfig(requestHost?: string | null) {
  const apiKey = process.env.FIREBASE_API_KEY;
  const host = requestHost?.split(":")[0]?.toLowerCase();
  const authDomain = host && authHosts().includes(host) ? host : process.env.FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const appId = process.env.FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  };
}

export function dataMode(): DataMode {
  if (firebaseWebConfig() && firebaseAdminConfigured()) return "firebase";
  if (process.env.NODE_ENV !== "production") return "local";
  return "unconfigured";
}

const globalStore = globalThis as unknown as {
  __depend?: { service: BoardService; store: MemoryStore | FirestoreStore };
};

function fileStore() {
  const file = path.join(process.cwd(), "data", "db.json");
  const store = new MemoryStore();
  if (existsSync(file)) {
    store.load(JSON.parse(readFileSync(file, "utf8")) as StoreSnapshot);
  }
  store.onChange = () => {
    mkdirSync(path.dirname(file), { recursive: true });
    const snapshot = store.dump();
    writeFileSync(file, JSON.stringify(snapshot, null, 2));
  };
  return store;
}

export function getRuntime() {
  if (dataMode() === "unconfigured") {
    throw new BoardError(
      "TaskOrb needs Firebase credentials before it can run in production. Add them on Render, then redeploy.",
      503,
    );
  }
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  if (dataMode() === "local") {
    const store = fileStore();
    return { store, service: new BoardService(store, appUrl) };
  }
  if (!globalStore.__depend) {
    const store = new FirestoreStore();
    globalStore.__depend = { store, service: new BoardService(store, appUrl) };
  }
  return globalStore.__depend;
}
