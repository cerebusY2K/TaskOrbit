"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { ActivityEntry } from "@/lib/types";
import { ghostBtn } from "./Modal";
import { timeAgo } from "./TaskThread";

export function BoardActivity({
  boardId,
  boardName,
  currentUid,
  onClose,
  onOpenTask,
}: {
  boardId: string;
  boardName: string;
  currentUid: string;
  onClose: () => void;
  /** Returns false when the task no longer exists. */
  onOpenTask: (dependencyId: string) => boolean;
}) {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<ActivityEntry[]>(`/api/boards/${boardId}/activity`)
      .then((items) => active && setEntries(items))
      .catch((err) => active && setError(err instanceof Error ? err.message : "Could not load activity."));
    return () => {
      active = false;
    };
  }, [boardId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-scrim/60 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-panel/95 p-5 text-white shadow-xl"
        aria-label="Board activity"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Activity</h2>
          <button type="button" className={ghostBtn} onClick={onClose} aria-label="Close activity">
            Close
          </button>
        </div>
        <p className="mt-1 text-sm text-white/55">Recent changes on {boardName}.</p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-clay">
            {error}
          </p>
        ) : null}
        <ul className="mt-5 grid gap-3">
          {entries === null && !error ? (
            <li className="text-sm text-white/45">Loading…</li>
          ) : entries?.length === 0 ? (
            <li className="text-sm text-white/45">Nothing yet. Changes to tasks on this board will show up here.</li>
          ) : (
            entries?.map((entry) => {
              const body = (
                <>
                  <span className="font-medium text-white">{entry.actorUid === currentUid ? "You" : entry.actorName}</span>{" "}
                  <span className="text-white/75">{entry.text}</span>
                  <span className="mt-0.5 block text-xs text-white/40">{timeAgo(entry.createdAt)}</span>
                </>
              );
              return (
                <li key={entry.id} className="border-l-2 border-white/10 pl-3 text-sm">
                  {entry.dependencyId ? (
                    <button
                      type="button"
                      className="text-left hover:opacity-80"
                      onClick={() => {
                        if (!onOpenTask(entry.dependencyId!)) setError("That task has been deleted.");
                      }}
                    >
                      {body}
                    </button>
                  ) : (
                    body
                  )}
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </div>
  );
}
