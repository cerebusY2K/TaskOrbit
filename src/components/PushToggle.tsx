"use client";

import { useEffect, useState } from "react";
import { disablePush, enablePush, pushState, type PushState } from "@/lib/push-client";

export function PushToggle() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pushState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);

  if (!state || state === "unsupported") return null;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setState(await pushState());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change push notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm">
      {state === "needs-install" ? (
        <p className="text-white/70">
          On iPhone and iPad, add TaskOrb to your Home Screen (Share, then Add to Home Screen) to get push notifications.
        </p>
      ) : state === "denied" ? (
        <p className="text-white/70">Notifications are blocked for TaskOrb. Allow them in your browser or phone settings.</p>
      ) : state === "on" ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-white/80">Push notifications are on for this device.</p>
          <button
            type="button"
            className="shrink-0 text-sm font-medium text-white/55 hover:text-white"
            disabled={busy}
            onClick={() => run(disablePush)}
          >
            Turn off
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-white/70">Get a push notification when someone assigns you a task.</p>
          <button
            type="button"
            className="shrink-0 rounded-lg bg-[#4d84ff] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#3b70f0]"
            disabled={busy}
            onClick={() => run(enablePush)}
          >
            {busy ? "Turning on…" : "Turn on"}
          </button>
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-clay">{error}</p> : null}
    </div>
  );
}
