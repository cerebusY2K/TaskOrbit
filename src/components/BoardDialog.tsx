"use client";

import { useState } from "react";
import { Modal, Field, fieldClass, ghostBtn, primaryBtn } from "./Modal";

export function BoardDialog({
  board,
  canDelete,
  onClose,
  onSubmit,
  onDelete,
}: {
  board?: { name: string; color: string };
  canDelete?: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; color: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState(board?.name ?? "");
  const [color, setColor] = useState(board?.color ?? "#6554c0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name, color });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the board.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={board ? "Edit board" : "New board"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Board name">
          <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Board color">
          <div className="mt-1 flex items-center gap-3">
            <input
              aria-label="Board color"
              className="h-11 w-16 cursor-pointer rounded-lg border border-white/15 bg-white/5 p-1"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
            <span className="text-sm text-white/60">This color tints the board and its orbit.</span>
          </div>
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          {onDelete && canDelete ? (
            <button
              type="button"
              className="text-sm font-medium text-clay"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("Delete this board and the cards on it? Your Me card moves to another board.")) return;
                setBusy(true);
                setError(null);
                try {
                  await onDelete();
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not delete the board.");
                  setBusy(false);
                }
              }}
            >
              Delete board
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className={ghostBtn} onClick={onClose}>
              Cancel
            </button>
            <button className={primaryBtn} disabled={busy} type="submit">
              {busy ? "Saving…" : "Save board"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
