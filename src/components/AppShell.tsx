"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, type BoardPayload, type PublicConfig } from "@/lib/api-client";
import { todayISO } from "@/lib/domain";
import { clientAuth, warmAuth } from "@/lib/firebase-client";
import { isNativeApp, nativeSignOut } from "@/lib/native";
import { boardTemplate, type BoardTemplate } from "@/lib/templates";
import { BoardOrbit } from "./BoardOrbit";
import { BoardScreen } from "./BoardScreen";
import { LoginScreen } from "./LoginScreen";

const TEMPLATE_KEY = "taskorb-template";

export function AppShell({
  initialConfig,
  landing,
}: {
  /** Passed when the server already knows the visitor is signed out, so the sign-in page renders without a round trip. */
  initialConfig?: PublicConfig;
  landing?: ReactNode;
}) {
  const [config, setConfig] = useState<PublicConfig | null>(initialConfig ?? null);
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [loading, setLoading] = useState(!initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [openBoardId, setOpenBoardId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<BoardTemplate | null>(null);
  const [creating, setCreating] = useState<BoardTemplate | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const openBoard = useCallback((boardId: string) => {
    setOpenTaskId(null);
    setOpenBoardId(boardId);
  }, []);
  const openTask = useCallback((boardId: string, taskId: string) => {
    setOpenTaskId(taskId);
    setOpenBoardId(boardId);
  }, []);

  const signOut = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    await nativeSignOut();
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
    if (!config?.firebase || isNativeApp()) return;
    void warmAuth(clientAuth(config.firebase));
  }, [config]);

  useEffect(() => {
    if (initialConfig) return;
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
  }, [initialConfig, refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("template");
    if (requested) {
      sessionStorage.setItem(TEMPLATE_KEY, requested);
      params.delete("template");
      const query = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
    }
    const stored = sessionStorage.getItem(TEMPLATE_KEY);
    const template = stored ? boardTemplate(stored) : null;
    if (stored && !template) sessionStorage.removeItem(TEMPLATE_KEY);
    setPendingTemplate(template);
  }, []);

  useEffect(() => {
    if (!board || !pendingTemplate) return;
    const template = pendingTemplate;
    sessionStorage.removeItem(TEMPLATE_KEY);
    setPendingTemplate(null);
    setCreating(template);
    void (async () => {
      try {
        const { boardId } = await api<{ boardId: string }>("/api/templates", {
          method: "POST",
          body: JSON.stringify({ slug: template.slug, today: todayISO() }),
        });
        await refresh();
        setOpenBoardId(boardId);
      } catch (err) {
        setTemplateError(err instanceof Error ? err.message : `Could not set up the ${template.name} board.`);
      } finally {
        setCreating(null);
      }
    })();
  }, [board, pendingTemplate, refresh]);

  useEffect(() => {
    if (!board) return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("board");
    if (!requested) return;
    window.history.replaceState(null, "", window.location.pathname);
    if (board.boards.some((item) => item.id === requested)) setOpenBoardId(requested);
  }, [board]);

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
        <LoginScreen config={config} onSignedIn={refresh} templateName={pendingTemplate?.name}>
          {landing}
        </LoginScreen>
      </>
    );
  }
  if (creating) {
    return <p className="px-6 py-10 text-sm text-white/85">Setting up your {creating.name} board…</p>;
  }
  const notice = templateError ? (
    <p
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-clay/40 bg-danger-bg px-4 py-2 text-sm text-clay"
    >
      {templateError}
    </p>
  ) : null;
  if (!openBoardId) {
    return (
      <>
        <BoardOrbit payload={board} onOpen={openBoard} onOpenTask={openTask} onReload={refresh} onSignOut={signOut} />
        {notice}
      </>
    );
  }
  return (
    <BoardScreen
      key={openBoardId}
      board={board}
      initialBoardId={openBoardId}
      initialTaskId={openTaskId}
      onReload={refresh}
      onSignOut={signOut}
      onShowAll={() => setOpenBoardId(null)}
    />
  );
}
