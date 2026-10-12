"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { myTasks, labelColor, checklistProgress, type MyTask } from "@/lib/task-filters";
import type { BoardPayload } from "@/lib/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/types";
import { ghostBtn } from "./Modal";

function shortDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function MyTasksPanel({
  payload,
  today,
  onClose,
  onOpen,
  onChanged,
}: {
  payload: BoardPayload;
  today: string;
  onClose: () => void;
  onOpen: (item: MyTask) => void;
  onChanged: () => Promise<void>;
}) {
  const groups = myTasks(payload, today);
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function complete(item: MyTask) {
    setBusy(item.task.id);
    setError(null);
    try {
      await api(`/api/dependencies/${item.task.id}`, { method: "PATCH", body: JSON.stringify({ status: "done" }) });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark it done.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-scrim/60 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-panel/95 p-5 text-white shadow-xl"
        aria-label="My tasks"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My tasks</h2>
          <button type="button" className={ghostBtn} onClick={onClose} aria-label="Close my tasks">
            Close
          </button>
        </div>
        <p className="mt-1 text-sm text-white/55">
          Open tasks assigned to you on any board, plus unassigned tasks on boards you own.
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-clay">
            {error}
          </p>
        ) : null}
        {total === 0 ? (
          <p className="mt-8 text-center text-sm text-white/50">Nothing on your plate. Enjoy it.</p>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="mt-6">
              <h3
                className={`text-xs font-semibold uppercase tracking-[0.15em] ${
                  group.key === "overdue" ? "text-danger-soft" : "text-white/50"
                }`}
              >
                {group.label} · {group.items.length}
              </h3>
              <ul className="mt-2 grid gap-2">
                {group.items.map((item) => {
                  const progress = checklistProgress(item.task);
                  return (
                    <li key={item.task.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <button
                        type="button"
                        aria-label={`Mark ${item.task.name} done`}
                        title="Mark done"
                        disabled={busy === item.task.id}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-white/40 transition hover:border-success hover:bg-success/30 disabled:opacity-50"
                        onClick={() => complete(item)}
                      />
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(item)}>
                        <span className="block truncate text-sm font-medium text-white">{item.task.name}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
                          <span className="inline-flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full" style={{ background: item.board.color }} />
                            {item.board.name} · {item.card.name}
                          </span>
                          {item.task.deadline ? (
                            <span className={group.key === "overdue" ? "text-danger-soft" : ""}>{shortDay(item.task.deadline)}</span>
                          ) : null}
                          {item.task.priority ? <span>{PRIORITY_LABELS[item.task.priority]}</span> : null}
                          {item.task.status !== "open" ? <span>{STATUS_LABELS[item.task.status]}</span> : null}
                          {progress.total ? (
                            <span>
                              ☑ {progress.done}/{progress.total}
                            </span>
                          ) : null}
                          {item.task.labels.map((label) => (
                            <span key={label} className="rounded-full px-1.5" style={{ background: `${labelColor(label)}33` }}>
                              {label}
                            </span>
                          ))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </aside>
    </div>
  );
}
