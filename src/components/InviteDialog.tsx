"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Modal, ghostBtn, primaryBtn } from "./Modal";

export function InviteDialog({ onClose, onCopied }: { onClose: () => void; onCopied: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<{ url: string }>("/api/invite", { method: "POST" })
      .then((result) => {
        if (active) setUrl(result.url);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not create an invite link.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    onCopied();
    onClose();
  }

  return (
    <Modal title="Invite with a link" onClose={onClose}>
      <div className="grid gap-4">
        <p className="text-sm text-[#5e564c]">
          Copy this link and send it however you like. When someone opens it and signs in with
          Google, they join Hitch and you both get a notification. Their board stays private.
        </p>
        <label className="block text-sm font-medium text-[#4d463d]">
          Invite link
          <input
            className="mt-1 w-full rounded-lg border border-[#dfe1e6] bg-[#f7f8f9] px-3 py-2 text-sm text-[#172b4d]"
            readOnly
            value={url ?? ""}
            placeholder="Creating your link…"
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Close
          </button>
          <button type="button" className={primaryBtn} disabled={!url} onClick={copy}>
            Copy link
          </button>
        </div>
      </div>
    </Modal>
  );
}
