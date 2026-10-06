"use client";

import { useEffect, useState } from "react";
import { api, type PublicConfig } from "@/lib/api-client";
import { clientAuth, consumeGoogleRedirect, friendlyAuthError, googleIdToken, warmAuth } from "@/lib/firebase-client";
import { primaryBtn } from "./Modal";

export function LoginScreen({
  config,
  onSignedIn,
  inviteFrom,
}: {
  config: PublicConfig;
  onSignedIn: () => Promise<void>;
  inviteFrom?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!config.firebase) return;
    const auth = clientAuth(config.firebase);
    let active = true;
    void warmAuth(auth);
    void (async () => {
      try {
        const token = await consumeGoogleRedirect(auth);
        if (!active || !token) return;
        setBusy(true);
        await api("/api/auth/firebase", {
          method: "POST",
          body: JSON.stringify({ idToken: token }),
        });
        if (active) await onSignedIn();
      } catch (err) {
        if (active) setError(friendlyAuthError(err));
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [config.firebase, onSignedIn]);

  async function signInGoogle() {
    if (!config.firebase) return;
    setBusy(true);
    setError(null);
    try {
      const token = await googleIdToken(clientAuth(config.firebase));
      if (!token) return;
      await api("/api/auth/firebase", {
        method: "POST",
        body: JSON.stringify({ idToken: token }),
      });
      await onSignedIn();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <p className="text-sm font-semibold text-[#0c66e4]">TaskOrbit</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#172b4d]">
          {inviteFrom ? `${inviteFrom} invited you` : "Your board"}
        </h1>
        <p className="mt-2 text-sm text-[#44546f]">
          {inviteFrom
            ? "Sign in with Google to join. Your board stays private."
            : "Cards stay private. Share a link if you want someone else to join, then drag work between your own cards."}
        </p>
        {config.firebase ? (
          <button type="button" className={`${primaryBtn} mt-6 w-full`} disabled={busy} onClick={signInGoogle}>
            {busy ? "Signing in…" : "Continue with Google"}
          </button>
        ) : (
          <p className="mt-6 text-sm text-[#44546f]">{config.message || "Google sign-in is not configured yet."}</p>
        )}
        {error ? (
          <p role="alert" className="mt-4 text-sm text-clay">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
