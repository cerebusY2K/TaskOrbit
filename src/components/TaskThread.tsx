"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { ActivityEntry, TaskComment } from "@/lib/types";
import { primaryBtn } from "./Modal";

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function TaskThread({
  dependencyId,
  currentUid,
  isBoardOwner,
  onChanged,
}: {
  dependencyId: string;
  currentUid: string;
  isBoardOwner: boolean;
  onChanged: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"comments" | "activity">("comments");
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const thread = await api<{ comments: TaskComment[]; activity: ActivityEntry[] }>(
      `/api/dependencies/${dependencyId}/comments`,
    );
    setComments(thread.comments);
    setActivity(thread.activity);
  }, [dependencyId]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Could not load comments."));
  }, [load]);

  async function post() {
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/dependencies/${dependencyId}/comments`, { method: "POST", body: JSON.stringify({ body: draft }) });
      setDraft("");
      await load();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the comment.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(comment: TaskComment) {
    if (!window.confirm("Delete this comment?")) return;
    setError(null);
    try {
      await api(`/api/comments/${comment.id}`, { method: "DELETE" });
      await load();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the comment.");
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm transition ${active ? "bg-white/15 font-medium text-white" : "text-white/60 hover:text-white"}`;

  return (
    <section className="mt-5 border-t border-white/10 pt-4" aria-label="Comments and activity">
      <div role="tablist" className="flex gap-1">
        <button type="button" role="tab" aria-selected={tab === "comments"} className={tabClass(tab === "comments")} onClick={() => setTab("comments")}>
          Comments{comments?.length ? ` · ${comments.length}` : ""}
        </button>
        <button type="button" role="tab" aria-selected={tab === "activity"} className={tabClass(tab === "activity")} onClick={() => setTab("activity")}>
          Activity
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-clay">
          {error}
        </p>
      ) : null}
      {tab === "comments" ? (
        <>
          <ul className="mt-3 grid gap-3">
            {comments === null ? (
              <li className="text-sm text-white/45">Loading…</li>
            ) : comments.length === 0 ? (
              <li className="text-sm text-white/45">No comments yet. Ask a question or leave an update.</li>
            ) : (
              comments.map((comment) => (
                <li key={comment.id} className="rounded-xl bg-white/[0.04] px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {comment.authorUid === currentUid ? "You" : comment.authorName}
                      <span className="ml-2 text-xs font-normal text-white/45">{timeAgo(comment.createdAt)}</span>
                    </p>
                    {comment.authorUid === currentUid || isBoardOwner ? (
                      <button type="button" className="text-xs text-white/45 hover:text-clay" onClick={() => remove(comment)}>
                        Delete
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/80">{comment.body}</p>
                </li>
              ))
            )}
          </ul>
          <div className="mt-3 grid gap-2">
            <textarea
              aria-label="Write a comment"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-[#4d84ff] placeholder:text-white/35 focus:ring-2"
              rows={2}
              maxLength={2000}
              placeholder="Write a comment. Ctrl + Enter to send."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  void post();
                }
              }}
            />
            <div className="flex justify-end">
              <button type="button" className={primaryBtn} disabled={busy || !draft.trim()} onClick={post}>
                {busy ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <ul className="mt-3 grid gap-2">
          {activity.length === 0 ? (
            <li className="text-sm text-white/45">No activity recorded yet.</li>
          ) : (
            activity.map((entry) => (
              <li key={entry.id} className="text-sm text-white/70">
                <span className="font-medium text-white/90">{entry.actorUid === currentUid ? "You" : entry.actorName}</span>{" "}
                {entry.text}
                <span className="ml-2 text-xs text-white/40">{timeAgo(entry.createdAt)}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}
