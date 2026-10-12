"use client";

import { useState } from "react";
import { BOARD_TEMPLATES, templateTaskCount } from "@/lib/templates";
import { Modal, Field, fieldClass, ghostBtn, primaryBtn } from "./Modal";

export type BoardDialogInput = { name: string; color: string; template: string | null };

const BLANK_COLOR = "#6554c0";

export function BoardDialog({
  board,
  canDelete,
  onClose,
  onSubmit,
  onDelete,
  onImport,
}: {
  board?: { name: string; color: string };
  canDelete?: boolean;
  onClose: () => void;
  onSubmit: (input: BoardDialogInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onImport?: () => void;
}) {
  const [name, setName] = useState(board?.name ?? "");
  const [color, setColor] = useState(board?.color ?? BLANK_COLOR);
  const [template, setTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosen = BOARD_TEMPLATES.find((item) => item.slug === template) ?? null;

  function pick(slug: string | null) {
    const next = BOARD_TEMPLATES.find((item) => item.slug === slug) ?? null;
    const previousName = chosen?.name ?? "";
    if (name.trim() === "" || name === previousName) setName(next?.name ?? "");
    if (color === (chosen?.color ?? BLANK_COLOR)) setColor(next?.color ?? BLANK_COLOR);
    setTemplate(slug);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name, color, template });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the board.");
    } finally {
      setBusy(false);
    }
  }

  const option = (selected: boolean) =>
    `flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
      selected ? "border-accent bg-accent/15 text-white" : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
    }`;

  return (
    <Modal title={board ? "Edit board" : "New board"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        {board ? null : (
          <fieldset>
            <legend className="text-sm font-medium text-white/75">Start with</legend>
            <div role="radiogroup" aria-label="Start with" className="mt-2 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              <button
                type="button"
                role="radio"
                aria-checked={template === null}
                className={option(template === null)}
                onClick={() => pick(null)}
              >
                <span aria-hidden className="h-3 w-3 shrink-0 rounded-full border border-white/40" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">Blank board</span>
                  <span className="block text-xs text-white/50">Just a Done card</span>
                </span>
              </button>
              {BOARD_TEMPLATES.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  role="radio"
                  aria-checked={template === item.slug}
                  className={option(template === item.slug)}
                  onClick={() => pick(item.slug)}
                >
                  <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: item.color }} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.name}</span>
                    <span className="block text-xs text-white/50">
                      {item.cards.length} cards · {templateTaskCount(item)} tasks
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {chosen ? (
              <p className="mt-2 text-xs text-white/55">
                Cards: {chosen.cards.map((card) => card.name).join(", ")}. Dates start today, and you can change anything
                afterwards.
              </p>
            ) : null}
          </fieldset>
        )}
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
        {onImport ? (
          <p className="-mt-1 text-sm text-white/60">
            Moving from Trello, Asana or a spreadsheet?{" "}
            <button type="button" className="text-accent-soft underline-offset-2 hover:text-white hover:underline" onClick={onImport}>
              Import a board
            </button>
          </p>
        ) : null}
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
              {busy ? "Saving…" : chosen ? "Create from template" : board ? "Save board" : "Create board"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
