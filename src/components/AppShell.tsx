"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type BoardPayload, type PublicConfig } from "@/lib/api-client";
import { clientAuth, warmAuth } from "@/lib/firebase-client";
import { BoardOrbit } from "./BoardOrbit";
import { BoardScreen } from "./BoardScreen";
import { LoginScreen } from "./LoginScreen";

export function AppShell() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBoardId, setOpenBoardId] = useState<string | null>(null);

  const openBoard = useCallback((boardId: string) => setOpenBoardId(boardId), []);

  const signOut = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setOpenBoardId(null);
    setBoard(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await api<BoardPayload>("/api/board");
      setBoard(next);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load the dashboard.";
      setBoard(null);
      if (message !== "Sign in required.") setError(message);
    }
  }, []);

  useEffect(() => {
    if (!config?.firebase) return;
    void warmAuth(clientAuth(config.firebase));
  }, [config]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const nextConfig = await api<PublicConfig>("/api/config");
        if (!active) return;
        setConfig(nextConfig);
        if (nextConfig.mode !== "unconfigured") await refresh();
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not start TaskOrb.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  if (loading) {
    return <p className="px-6 py-10 text-sm text-white/85">Loading your board…</p>;
  }
  if (!config || config.mode === "unconfigured") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-white">TaskOrb</h1>
        <p className="mt-4 text-white/85">
          {config?.message || error || "Firebase is not configured on this server yet."}
        </p>
      </main>
    );
  }
  if (!board) {
    return (
      <>
        {error ? (
          <p role="alert" className="mx-auto mt-6 max-w-xl px-6 text-sm text-clay">
            {error}
          </p>
        ) : null}
        <LoginScreen config={config} onSignedIn={refresh} />
      </>
    );
  }
  if (!openBoardId) {
    return <BoardOrbit payload={board} onOpen={openBoard} onSignOut={signOut} />;
  }
  return (
    <BoardScreen
      key={openBoardId}
      board={board}
      initialBoardId={openBoardId}
      onReload={refresh}
      onSignOut={signOut}
      onShowAll={() => setOpenBoardId(null)}
    />
  );
}
