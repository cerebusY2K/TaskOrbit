"use client";

import { useEffect, useState, type ReactNode } from "react";
import { api, type PublicConfig } from "@/lib/api-client";
import { clientAuth, consumeGoogleRedirect, friendlyAuthError, googleIdToken, warmAuth } from "@/lib/firebase-client";
import { isNativeApp, nativeGoogleIdToken } from "@/lib/native";
import { OrbitBackdrop } from "./OrbitBackdrop";

export function LoginScreen({
  config,
  onSignedIn,
  inviteFrom,
  inviteBoard,
  children,
}: {
  config: PublicConfig;
  onSignedIn: () => Promise<void>;
  inviteFrom?: string | null;
  inviteBoard?: string | null;
  children?: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!config.firebase || isNativeApp()) return;
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
      const token = isNativeApp() ? await nativeGoogleIdToken() : await googleIdToken(clientAuth(config.firebase));
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
    <main className="text-white">
      <div id="top" className="orbit-space relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
        <OrbitBackdrop className="absolute inset-0" />
        <div className="orbit-core pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <section className="glass-panel relative w-full max-w-sm rounded-2xl p-7 text-center">
          <OrbitMark className="mx-auto h-12 w-12" />
          <p className="mt-4 text-3xl font-semibold tracking-tight">TaskOrb</p>
          <h1 className="mt-2 text-base text-white/75">
            {inviteFrom ? `${inviteFrom} invited you to ${inviteBoard ?? "TaskOrb"}` : "Every task, in orbit."}
          </h1>
          <p className="mt-3 text-sm text-white/55">
            {inviteFrom
              ? inviteBoard
                ? "Sign in with Google to join the board. Your own boards stay private."
                : "Sign in with Google to join. Your boards stay private."
              : "Private boards for your work, people, and what each task is waiting on."}
          </p>
          {config.firebase ? (
            <button
              type="button"
              className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0b1430] shadow-[0_8px_30px_rgba(77,132,255,0.35)] transition hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              onClick={signInGoogle}
            >
              <GoogleIcon />
              {busy ? "Signing in…" : "Continue with Google"}
            </button>
          ) : (
            <p className="mt-7 text-sm text-white/60">{config.message || "Google sign-in is not configured yet."}</p>
          )}
          {error ? (
            <p role="alert" className="mt-4 text-sm text-clay">
              {error}
            </p>
          ) : null}
        </section>
        {children ? (
          <a href="#features" className="relative mt-6 text-sm text-white/60 transition hover:text-white">
            See how it works ↓
          </a>
        ) : null}
      </div>
      {children}
    </main>
  );
}

export function OrbitMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <defs>
        <radialGradient id="orbit-mark-core">
          <stop offset="0%" stopColor="#e3edff" />
          <stop offset="60%" stopColor="#6da2ff" />
          <stop offset="100%" stopColor="#6da2ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="24" cy="24" rx="20" ry="8" fill="none" stroke="#6da2ff" strokeOpacity="0.55" transform="rotate(-20 24 24)" />
      <ellipse cx="24" cy="24" rx="13" ry="5" fill="none" stroke="#a970ff" strokeOpacity="0.55" transform="rotate(25 24 24)" />
      <circle cx="24" cy="24" r="6" fill="url(#orbit-mark-core)" />
      <circle cx="42.6" cy="17.4" r="2.6" fill="#ff9f43" />
      <circle cx="13" cy="30.5" r="2" fill="#22b07d" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
