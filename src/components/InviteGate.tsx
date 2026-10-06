"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type BoardPayload, type PublicConfig } from "@/lib/api-client";
import { LoginScreen } from "./LoginScreen";

export function InviteGate({ token }: { token: string }) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [fromName, setFromName] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const accept = useCallback(async () => {
    const result = await api<{ status: string }>(`/api/invite/${encodeURIComponent(token)}`, {
      method: "POST",
    });
    if (result.status === "self") {
      window.location.href = "/";
      return;
    }
    window.location.href = "/";
  }, [token]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const nextConfig = await api<PublicConfig>("/api/config");
        if (!active) return;
        setConfig(nextConfig);
        const preview = await api<{ fromName: string }>(`/api/invite/${encodeURIComponent(token)}`);
        if (!active) return;
        setFromName(preview.fromName);
        if (nextConfig.mode !== "unconfigured") {
          try {
            await api<BoardPayload>("/api/board");
            if (!active) return;
            setSignedIn(true);
          } catch {
            if (active) setSignedIn(false);
          }
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "This invite link is not valid.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return <p className="px-6 py-10 text-sm text-white/85">Opening invite…</p>;
  }

  if (error || !config || config.mode === "unconfigured") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <p className="text-sm font-semibold text-[#0c66e4]">Hitch</p>
          <p role="alert" className="mt-3 text-sm text-clay">
            {error || config?.message || "This invite link is not valid."}
          </p>
        </section>
      </main>
    );
  }

  if (signedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <p className="text-sm font-semibold text-[#0c66e4]">Hitch</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#172b4d]">
            {fromName} invited you
          </h1>
          <p className="mt-2 text-sm text-[#44546f]">
            Accept to join. Your cards stay on your own board.
          </p>
          <button
            type="button"
            className="mt-5 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              accept().catch((err) => setError(err instanceof Error ? err.message : "Could not join."));
            }}
          >
            Accept invite
          </button>
        </section>
      </main>
    );
  }

  return (
    <LoginScreen
      config={config}
      inviteFrom={fromName}
      onSignedIn={async () => {
        await accept();
      }}
    />
  );
}
