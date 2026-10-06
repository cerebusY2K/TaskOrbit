"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { isOverdue, textOnColor, todayISO } from "@/lib/domain";
import type { Board, BoardPayload, Card, Dependency, Status } from "@/lib/types";
import { PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/types";
import { BoardDialog } from "./BoardDialog";
import { CardDialog } from "./CardDialog";
import { DependencyDialog } from "./DependencyDialog";
import { InviteDialog } from "./InviteDialog";
import { ghostBtn } from "./Modal";

function formatDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortDependencies(items: Dependency[], today: string) {
  return [...items].sort((a, b) => {
    const overdueA = isOverdue(a.deadline, a.status, today) ? 0 : 1;
    const overdueB = isOverdue(b.deadline, b.status, today) ? 0 : 1;
    if (overdueA !== overdueB) return overdueA - overdueB;
    if (a.deadline && b.deadline && a.deadline !== b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function BoardScreen({
  board,
  onReload,
  onSignOut,
}: {
  board: BoardPayload;
  onReload: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [cardDialog, setCardDialog] = useState<Card | "new" | null>(null);
  const [boardDialog, setBoardDialog] = useState<Board | "new" | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [dependencyDialog, setDependencyDialog] = useState<{
    card: Card;
    dependency?: Dependency;
    focusHold?: boolean;
  } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<{
    id: string;
    name: string;
    fromCardId: string;
    x: number;
    y: number;
    overCardId: string | null;
  } | null>(null);
  const dragCleanup = useRef<(() => void) | null>(null);
  const today = todayISO();
  const unread = board.notifications.filter((item) => !item.read).length;
  const workspaces = [...board.boards].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const active = workspaces.find((item) => item.id === activeBoardId) ?? workspaces[0];
  const light = active ? textOnColor(active.color) === "#1c1915" : false;
  const cards = board.cards
    .filter((card) => card.boardId === active?.id)
    .sort((a, b) => Number(b.isSelf) - Number(a.isSelf) || a.createdAt.localeCompare(b.createdAt));

  useEffect(() => () => dragCleanup.current?.(), []);

  useEffect(() => {
    const allowDrop = (event: DragEvent) => {
      const column = (event.target as Element | null)?.closest?.("[data-card-id]");
      if (!column) return;
      event.preventDefault();
    };
    const dropOnCard = (event: DragEvent) => {
      const column = (event.target as Element | null)?.closest?.("[data-card-id]");
      const targetId = column?.getAttribute("data-card-id");
      const dependencyId = event.dataTransfer?.getData("text/plain") ?? "";
      if (!column || !targetId || !dependencyId) return;
      event.preventDefault();
      const item = board.dependencies.find((entry) => entry.id === dependencyId);
      setDrag(null);
      void relocate(dependencyId, item?.cardId ?? "", targetId);
    };
    window.addEventListener("dragover", allowDrop);
    window.addEventListener("drop", dropOnCard);
    return () => {
      window.removeEventListener("dragover", allowDrop);
      window.removeEventListener("drop", dropOnCard);
    };
  });

  async function relocate(dependencyId: string, fromCardId: string, targetId: string | null) {
    if (!dependencyId || !targetId || targetId === fromCardId) return;
    const target = board.cards.find((card) => card.id === targetId);
    try {
      await api(`/api/dependencies/${dependencyId}/move`, {
        method: "POST",
        body: JSON.stringify({ cardId: targetId }),
      });
      setError(null);
      setToast(target ? `Moved to ${target.name}.` : "Dependency moved.");
      await onReload();
    } catch (err) {
      setToast(null);
      setError(err instanceof Error ? err.message : "Could not move that dependency.");
    }
  }

  function beginDrag(event: React.PointerEvent, dependency: Dependency) {
    if (event.pointerType !== "touch") return;
    event.preventDefault();
    const pointerId = event.pointerId;
    const originX = event.clientX;
    const originY = event.clientY;
    let started = false;

    const columnAt = (x: number, y: number) =>
      document.elementFromPoint(x, y)?.closest("[data-card-id]")?.getAttribute("data-card-id") ?? null;

    const move = (native: PointerEvent) => {
      if (native.pointerId !== pointerId) return;
      if (!started && Math.hypot(native.clientX - originX, native.clientY - originY) < 4) return;
      started = true;
      setDrag({
        id: dependency.id,
        name: dependency.name,
        fromCardId: dependency.cardId,
        x: native.clientX,
        y: native.clientY,
        overCardId: columnAt(native.clientX, native.clientY),
      });
    };

    const finish = async (native: PointerEvent) => {
      if (native.pointerId !== pointerId) return;
      dragCleanup.current?.();
      dragCleanup.current = null;
      if (!started) {
        setDrag(null);
        return;
      }
      const targetId = columnAt(native.clientX, native.clientY);
      setDrag(null);
      await relocate(dependency.id, dependency.cardId, targetId);
    };

    const stop = (native: PointerEvent) => {
      void finish(native);
    };
    dragCleanup.current?.();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    dragCleanup.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }

  async function changeStatus(dependency: Dependency, status: Status) {
    if (status === "hold") {
      const card = board.cards.find((item) => item.id === dependency.cardId);
      if (!card) return;
      setDependencyDialog({ card, dependency: { ...dependency, status: "hold" }, focusHold: true });
      return;
    }
    setError(null);
    try {
      await api(`/api/dependencies/${dependency.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the status.");
    }
  }

  const barBtn = light
    ? "rounded-md bg-black/10 px-3 py-1.5 text-sm font-medium text-[#172b4d] transition hover:bg-black/15"
    : "rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/30";

  return (
    <div className="flex h-screen min-h-0 flex-col" style={{ background: active?.color ?? "#0c66e4" }}>
      <header className={`flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4 ${light ? "text-[#172b4d]" : "text-white"}`}>
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight">Hitch</p>
          <p className={`truncate text-xs ${light ? "text-[#172b4d]/70" : "text-white/80"}`}>
            {board.user.name} · drag a task onto another card
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={barBtn} onClick={() => setBoardDialog("new")}>
            Add board
          </button>
          <button type="button" className={barBtn} onClick={() => setInviteOpen(true)}>
            Invite
          </button>
          <button type="button" className={barBtn} onClick={() => setNotesOpen(true)}>
            Notifications{unread > 0 ? ` (${unread})` : ""}
          </button>
          <button type="button" className={barBtn} onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <div className="flex gap-2 overflow-x-auto px-3 pb-3 sm:px-4">
        {workspaces.map((item) => {
          const selected = item.id === active?.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                selected ? "bg-white text-[#172b4d]" : light ? "bg-black/10 text-[#172b4d]" : "bg-white/20 text-white"
              }`}
              onClick={() => setActiveBoardId(item.id)}
            >
              <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: item.color }} />
              {item.name}
            </button>
          );
        })}
        {active ? (
          <button type="button" className={barBtn} onClick={() => setBoardDialog(active)}>
            Board color
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mx-3 mb-2 rounded-lg bg-[#ffebe6] px-3 py-2 text-sm text-clay sm:mx-4">
          {error}
        </p>
      ) : null}
      {toast ? (
        <p role="status" className="mx-3 mb-2 rounded-lg bg-white px-3 py-2 text-sm text-[#0c66e4] sm:mx-4">
          {toast}
        </p>
      ) : null}

      <section className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto px-3 pb-4 sm:px-4">
        {cards.map((card) => {
          const dependencies = sortDependencies(
            board.dependencies.filter((item) => item.cardId === card.id),
            today,
          );
          const openCount = dependencies.filter((item) => item.status !== "done").length;
          const dropping = drag?.overCardId === card.id && drag.fromCardId !== card.id;
          return (
            <article
              key={card.id}
              data-card-id={card.id}
              aria-label={`Card ${card.name}`}
              className={`flex max-h-full w-[320px] shrink-0 flex-col rounded-xl bg-[#f1f2f4] ${
                dropping ? (light ? "ring-2 ring-[#172b4d]" : "ring-2 ring-white") : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
                setDrag((current) => (current ? { ...current, overCardId: card.id } : current));
              }}
            >
              <div className="flex items-start gap-2 px-3 pb-1 pt-3">
                <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ background: card.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-[#172b4d]">{card.name}</h2>
                    {card.isSelf ? (
                      <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-[#44546f]">
                        You
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-[#626f86]">{openCount} open</p>
                </div>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-[#44546f] hover:bg-[#e4e6ea]"
                  onClick={() => setCardDialog(card)}
                >
                  Edit
                </button>
              </div>
              <ul className="flex min-h-[12px] flex-1 flex-col gap-2 overflow-y-auto px-2 py-2">
                {dependencies.length === 0 ? (
                  <li className="px-2 py-4 text-center text-xs text-[#626f86]">Drop a task here</li>
                ) : (
                  dependencies.map((dependency) => {
                    const overdue = isOverdue(dependency.deadline, dependency.status, today);
                    const dueToday = dependency.deadline === today && dependency.status !== "done";
                    const dragging = drag?.id === dependency.id;
                    return (
                      <li
                        key={dependency.id}
                        className={`rounded-lg bg-white px-2 py-2 shadow-sm ${
                          overdue ? "dep-urgent ring-1 ring-[#e34935]" : ""
                        } ${dragging ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            draggable
                            aria-label={`Drag ${dependency.name} to another card`}
                            className="mt-0.5 cursor-grab touch-none text-[#626f86] active:cursor-grabbing"
                            onPointerDown={(event) => beginDrag(event, dependency)}
                            onDragStart={(event) => {
                              event.dataTransfer.setData("text/plain", dependency.id);
                              event.dataTransfer.effectAllowed = "move";
                              setDrag({
                                id: dependency.id,
                                name: dependency.name,
                                fromCardId: dependency.cardId,
                                x: event.clientX,
                                y: event.clientY,
                                overCardId: null,
                              });
                            }}
                            onDragEnd={() => setDrag(null)}
                          >
                            <GripIcon />
                          </button>
                          <button
                            type="button"
                            className={`min-w-0 flex-1 text-left text-sm font-medium ${
                              dependency.status === "done" ? "text-[#626f86] line-through" : "text-[#172b4d]"
                            }`}
                            onClick={() => setDependencyDialog({ card, dependency })}
                          >
                            {dependency.name}
                          </button>
                          <label className="sr-only" htmlFor={`status-${dependency.id}`}>
                            Status for {dependency.name}
                          </label>
                          <select
                            id={`status-${dependency.id}`}
                            aria-label={`Status for ${dependency.name}`}
                            className="max-w-[7.2rem] rounded-md border border-[#dfe1e6] bg-white px-1 py-0.5 text-xs"
                            value={dependency.status}
                            onChange={(event) => changeStatus(dependency, event.target.value as Status)}
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 pl-6 text-xs text-[#44546f]">
                          {overdue ? (
                            <span className="font-semibold text-clay">Overdue · {formatDay(dependency.deadline!)}</span>
                          ) : null}
                          {dueToday ? <span className="font-semibold text-clay">Due today</span> : null}
                          {dependency.deadline && !overdue && !dueToday ? (
                            <span>Due {formatDay(dependency.deadline)}</span>
                          ) : null}
                          {dependency.dependantOnLabel ? <span>Depends on {dependency.dependantOnLabel}</span> : null}
                          {dependency.taskOwner ? <span>Owner {dependency.taskOwner}</span> : null}
                          {dependency.priority ? <span>{PRIORITY_LABELS[dependency.priority]}</span> : null}
                          {dependency.waitingFor ? <span>Waiting for {dependency.waitingFor}</span> : null}
                          {dependency.blocks ? <span>Blocks {dependency.blocks}</span> : null}
                          {dependency.nextAction ? <span>Next: {dependency.nextAction}</span> : null}
                          {dependency.lastUpdate ? <span>Updated {formatDay(dependency.lastUpdate)}</span> : null}
                          {dependency.assignedByUid !== dependency.ownerId ? (
                            <span>From {dependency.assignedByName}</span>
                          ) : null}
                        </div>
                        {dependency.notes ? <p className="mt-1 line-clamp-2 pl-6 text-xs text-[#44546f]">{dependency.notes}</p> : null}
                        {dependency.status === "hold" && dependency.holdReason ? (
                          <p className="mt-1 pl-6 text-xs text-[#7a5b00]">Hold: {dependency.holdReason}</p>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>
              <div className="px-2 pb-2">
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-[#44546f] hover:bg-[#e4e6ea]"
                  onClick={() => setDependencyDialog({ card })}
                >
                  + Add a task
                </button>
              </div>
            </article>
          );
        })}
        <button
          type="button"
          className={`h-fit w-[300px] shrink-0 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-white/30 ${
            light ? "bg-black/10 text-[#172b4d]" : "bg-white/20 text-white"
          }`}
          onClick={() => setCardDialog("new")}
        >
          + Add a card
        </button>
      </section>
      {drag ? (
        <div
          className="pointer-events-none fixed z-50 w-56 rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#172b4d] shadow-xl"
          style={{ left: drag.x + 14, top: drag.y + 14 }}
        >
          {drag.name}
        </div>
      ) : null}

      {boardDialog ? (
        <BoardDialog
          board={boardDialog === "new" ? undefined : boardDialog}
          canDelete={workspaces.length > 1}
          onClose={() => setBoardDialog(null)}
          onDelete={
            boardDialog !== "new"
              ? async () => {
                  await api(`/api/boards/${boardDialog.id}`, { method: "DELETE" });
                  setActiveBoardId(null);
                  setToast("Board deleted.");
                  await onReload();
                }
              : undefined
          }
          onSubmit={async (input) => {
            if (boardDialog === "new") {
              const created = await api<Board>("/api/boards", {
                method: "POST",
                body: JSON.stringify(input),
              });
              setActiveBoardId(created.id);
              setToast("Board added.");
            } else {
              await api(`/api/boards/${boardDialog.id}`, {
                method: "PATCH",
                body: JSON.stringify(input),
              });
              setToast("Board updated.");
            }
            await onReload();
          }}
        />
      ) : null}

      {cardDialog ? (
        <CardDialog
          card={cardDialog === "new" ? undefined : cardDialog}
          onClose={() => setCardDialog(null)}
          onDelete={
            cardDialog !== "new" && !cardDialog.isSelf
              ? async () => {
                  await api(`/api/cards/${cardDialog.id}`, { method: "DELETE" });
                  setToast("Card deleted.");
                  await onReload();
                }
              : undefined
          }
          onSubmit={async (input) => {
            if (cardDialog === "new") {
              await api("/api/cards", {
                method: "POST",
                body: JSON.stringify({ ...input, boardId: active?.id }),
              });
              setToast("Card added.");
            } else {
              await api(`/api/cards/${cardDialog.id}`, {
                method: "PATCH",
                body: JSON.stringify(input),
              });
              setToast("Card updated.");
            }
            await onReload();
          }}
        />
      ) : null}

      {dependencyDialog ? (
        <DependencyDialog
          cardName={dependencyDialog.card.name}
          dependency={dependencyDialog.dependency}
          focusHold={dependencyDialog.focusHold}
          siblings={board.dependencies.filter((item) => item.cardId === dependencyDialog.card.id)}
          onClose={() => setDependencyDialog(null)}
          onSubmit={async (input) => {
            if (dependencyDialog.dependency) {
              await api(`/api/dependencies/${dependencyDialog.dependency.id}`, {
                method: "PATCH",
                body: JSON.stringify(input),
              });
              setToast("Task updated.");
              await onReload();
              return;
            }
            await api("/api/dependencies", {
              method: "POST",
              body: JSON.stringify({ ...input, cardId: dependencyDialog.card.id }),
            });
            setError(null);
            setToast("Task added.");
            await onReload();
          }}
          onDelete={
            dependencyDialog.dependency
              ? async () => {
                  await api(`/api/dependencies/${dependencyDialog.dependency!.id}`, { method: "DELETE" });
                  setToast("Task removed.");
                  await onReload();
                }
              : undefined
          }
        />
      ) : null}

      {inviteOpen ? (
        <InviteDialog
          onClose={() => setInviteOpen(false)}
          onCopied={() => {
            setError(null);
            setToast("Invite link copied.");
          }}
        />
      ) : null}

      {notesOpen ? (
        <div className="fixed inset-0 z-30 flex justify-end bg-[#1c1915]/40" onMouseDown={() => setNotesOpen(false)}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl"
            aria-label="Notifications"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#172b4d]">Notifications</h2>
              <button type="button" className={ghostBtn} onClick={() => setNotesOpen(false)} aria-label="Close notifications">
                Close
              </button>
            </div>
            {unread > 0 ? (
              <button
                type="button"
                className={`${ghostBtn} mt-4`}
                onClick={async () => {
                  await api("/api/notifications/read", { method: "POST", body: JSON.stringify({}) });
                  await onReload();
                }}
              >
                Mark all read
              </button>
            ) : null}
            <ul className="mt-4 space-y-3">
              {board.notifications.length === 0 ? (
                <li className="text-sm text-[#6f675e]">No notifications yet.</li>
              ) : (
                board.notifications.map((item) => (
                  <li key={item.id} className={`rounded-lg border px-3 py-3 ${item.read ? "border-[#dfe1e6]" : "border-[#0c66e4] bg-[#e9f2ff]"}`}>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-[#5e564c]">{item.body}</p>
                    {item.read ? null : (
                      <button
                        type="button"
                        className="mt-2 text-sm font-medium text-[#0c66e4]"
                        onClick={async () => {
                          await api("/api/notifications/read", {
                            method: "POST",
                            body: JSON.stringify({ id: item.id }),
                          });
                          await onReload();
                        }}
                      >
                        Mark read
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </aside>
        </div>
      ) : null}

    </div>
  );
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="4" cy="3" r="1.1" fill="currentColor" />
      <circle cx="10" cy="3" r="1.1" fill="currentColor" />
      <circle cx="4" cy="7" r="1.1" fill="currentColor" />
      <circle cx="10" cy="7" r="1.1" fill="currentColor" />
      <circle cx="4" cy="11" r="1.1" fill="currentColor" />
      <circle cx="10" cy="11" r="1.1" fill="currentColor" />
    </svg>
  );
}
