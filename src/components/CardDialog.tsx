"use client";

import { useState } from "react";
import { CARD_COLORS } from "@/lib/types";
import type { Card } from "@/lib/types";
import { Field, Modal, fieldClass, ghostBtn, primaryBtn } from "./Modal";

export function CardDialog({
  card,
  onClose,
  onSubmit,
  onDelete,
}: {
  card?: Card;
  onClose: () => void;
  onSubmit: (input: { name: string; color: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState(card?.name ?? "");
  const [color, setColor] = useState(card?.color ?? CARD_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isSelf = Boolean(card?.isSelf);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name, color });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isSelf ? "Me card" : card ? "Edit card" : "New card"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        {isSelf ? (
          <p className="text-sm text-[#5e564c]">This is your list. You can change its color.</p>
        ) : (
          <Field label="Card name">
            <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
        )}
        <div>
          <p className="text-sm font-medium text-[#4d463d]">Color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CARD_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use color ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => setColor(swatch)}
                className="h-9 w-9 rounded-full border-2"
                style={{
                  background: swatch,
                  borderColor: color === swatch ? "#1c1915" : "transparent",
                }}
              />
            ))}
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              type="button"
              className="text-sm font-medium text-clay"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("Delete this card and its dependencies?")) return;
                setBusy(true);
                setError(null);
                try {
                  await onDelete();
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not delete the card.");
                  setBusy(false);
                }
              }}
            >
              Delete card
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className={ghostBtn} onClick={onClose}>
              Cancel
            </button>
            <button className={primaryBtn} disabled={busy} type="submit">
              {busy ? "Saving…" : "Save card"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
