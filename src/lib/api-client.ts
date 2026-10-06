import type { BoardPayload } from "./types";

export type PublicConfig = {
  mode: "firebase" | "local" | "unconfigured";
  firebase: null | {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
    messagingSenderId: string;
  };
  message: string | null;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data as T;
}

export type { BoardPayload };
