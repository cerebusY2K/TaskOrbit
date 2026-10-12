"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { IMPORT_MAX_TASKS, importCounts, parseImportFile, type ImportResult } from "@/lib/importers";
import { Field, Modal, fieldClass, ghostBtn, primaryBtn } from "./Modal";

const MAX_FILE_BYTES = 25_000_000;

export function ImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (result: { boardId: string; cards: number; tasks: number }) => Promise<void>;
}) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function readFile(file: File | undefined) {
    setError(null);
    setResult(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is too large. Export a single board, or split the CSV.");
      return;
    }
    try {
      const parsed = parseImportFile(file.name, await file.text());
      setResult(parsed);
      setName(parsed.board.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That file could not be read.");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ boardId: string; cards: number; tasks: number }>("/api/import", {
        method: "POST",
        body: JSON.stringify({ ...result.board, name, source: result.source }),
      });
      await onImported(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import the board.");
    } finally {
      setBusy(false);
    }
  }

  const counts = result ? importCounts(result.board) : null;

  return (
    <Modal title="Import a board" onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-2 text-sm text-white/65">
          <p>
            <strong className="font-medium text-white/85">From Trello:</strong> open the board, then the board menu,
            Print, export and share, Export as JSON. Lists become cards, cards become tasks, with labels, checklists,
            due dates and descriptions. Archived cards are skipped.
          </p>
          <p>
            <strong className="font-medium text-white/85">From a spreadsheet, Asana or anything else:</strong> a CSV
            with a header row. Only a Task (or Name) column is required. Optional columns: Card (or List, Section),
            Status, Start date, Due date, Priority, Labels, Notes, Completed.
          </p>
        </div>
        <Field label="File">
          <input
            className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-white/15 file:px-3 file:py-1 file:text-sm file:text-white`}
            type="file"
            accept=".json,.csv,.tsv,.txt,application/json,text/csv"
            onChange={(event) => void readFile(event.target.files?.[0])}
          />
        </Field>
        {result && counts ? (
          <>
            <Field label="Board name">
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
            </Field>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/75" role="status">
              <p>
                From {result.source}: {counts.cards} card{counts.cards === 1 ? "" : "s"} and {counts.tasks} task
                {counts.tasks === 1 ? "" : "s"}
                {counts.done ? `, ${counts.done} already done` : ""}.
              </p>
              {result.board.cards.length ? (
                <ul className="mt-2 grid gap-0.5 text-xs text-white/55">
                  {result.board.cards.slice(0, 6).map((card, index) => (
                    <li key={`${card.name}-${index}`}>
                      {card.name} · {card.tasks.length} task{card.tasks.length === 1 ? "" : "s"}
                    </li>
                  ))}
                  {result.board.cards.length > 6 ? <li>and {result.board.cards.length - 6} more cards</li> : null}
                </ul>
              ) : null}
              {result.warnings.length ? (
                <ul className="mt-2 grid gap-0.5 text-xs text-warn-soft">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <p className="text-xs text-white/45">
              Owners are not imported. Assign tasks after the import. Up to {IMPORT_MAX_TASKS} tasks per board.
            </p>
          </>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={primaryBtn} disabled={busy || !result || (!counts?.tasks && !counts?.cards)} type="submit">
            {busy ? "Importing…" : "Import board"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
