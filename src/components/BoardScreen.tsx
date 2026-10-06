"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { isOverdue, todayISO } from "@/lib/domain";
import type { Board, BoardPayload, Card, Dependency, Status } from "@/lib/types";
import { PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/types";
import { BoardDialog } from "./BoardDialog";
import { CardDialog } from "./CardDialog";
import { DependencyDialog } from "./DependencyDialog";
import { InviteDialog } from "./InviteDialog";
import { OrbitMark } from "./LoginScreen";
import { ghostBtn } from "./Modal";
import { OrbitBackdrop } from "./OrbitBackdrop";
import { toRgb } from "./orbit-math";

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
  initialBoardId = null,
  onReload,
  onSignOut,
  onShowAll,
}: {
  board: BoardPayload;
  initialBoardId?: string | null;
  onReload: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onShowAll?: () => void;
}) {
  const [cardDialog, setCardDialog] = useState<Card | "new" | null>(null);
  const [boardDialog, setBoardDialog] = useState<Board | "new" | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(initialBoardId);
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

  const accent = toRgb(active?.color ?? "#4d84ff");
  const barBtn =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white";

  return (
    <div className="orbit-space relative flex h-screen min-h-0 flex-col overflow-hidden text-white">
      <OrbitBackdrop className="absolute inset-0 opacity-30" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-500"
        style={{ background: `radial-gradient(70% 45% at 50% -10%, rgba(${accent}, 0.28), transparent 70%)` }}
      />
      <header className="relative flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {onShowAll ? (
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={onShowAll}
            >
              <OrbitMark className="h-7 w-7" />
              All boards
            </button>
          ) : (
            <OrbitMark className="h-8 w-8" />
          )}
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-lg font-semibold tracking-tight">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: active?.color, boxShadow: `0 0 12px rgba(${accent}, 0.9)` }}
              />
              {active?.name ?? "TaskOrb"}
            </h1>
            <p className="truncate text-xs text-white/50">{board.user.name} · drag a task onto another card</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={barBtn} onClick={() => setBoardDialog("new")}>
            Add board
          </button>
          <button type="button" className={barBtn} onClick={() => setInviteOpen(true)}>
            Invite
          </button>
          <button type="button" className={`${barBtn} relative`} onClick={() => setNotesOpen(true)}>
            Notifications
            {unread > 0 ? (
              <span className="ml-1.5 rounded-full bg-[#4d84ff] px-1.5 py-0.5 text-[11px] font-semibold text-white">{unread}</span>
            ) : null}
          </button>
          <button type="button" className={barBtn} onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <nav aria-label="Boards" className="relative flex gap-2 overflow-x-auto px-3 pb-3 sm:px-5">
        {workspaces.map((item) => {
          const selected = item.id === active?.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
                selected ? "bg-white/15 font-medium text-white" : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
              }`}
              style={selected ? { boxShadow: `inset 0 0 0 1px ${item.color}` } : undefined}
              onClick={() => setActiveBoardId(item.id)}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              {item.name}
            </button>
          );
        })}
        {active ? (
          <button
            type="button"
            className="shrink-0 rounded-full px-3 py-1.5 text-sm text-white/55 transition hover:bg-white/10 hover:text-white"
            onClick={() => setBoardDialog(active)}
          >
            Edit board
          </button>
        ) : null}
      </nav>

      {error ? (
        <p role="alert" className="relative mx-3 mb-2 rounded-lg border border-[#ff6b57]/40 bg-[#3a1418]/80 px-3 py-2 text-sm text-[#ffb4a6] sm:mx-5">
          {error}
        </p>
      ) : null}
      {toast ? (
        <p role="status" className="relative mx-3 mb-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white sm:mx-5">
          {toast}
        </p>
      ) : null}

      <section className="relative flex min-h-0 flex-1 items-start gap-3 overflow-x-auto px-3 pb-4 sm:px-5">
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
              className={`glass-panel flex max-h-full w-[320px] shrink-0 flex-col rounded-2xl ${dropping ? "ring-2 ring-white/70" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
                setDrag((current) => (current ? { ...current, overCardId: card.id } : current));
              }}
            >
              <div className="flex items-start gap-2.5 px-3 pb-1 pt-3">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: card.color, boxShadow: `0 0 10px ${card.color}` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold">{card.name}</h2>
                    {card.isSelf ? (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/70">You</span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-white/50">{openCount} open</p>
                </div>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-white/55 hover:bg-white/10 hover:text-white"
                  onClick={() => setCardDialog(card)}
                >
                  Edit
                </button>
              </div>
              <ul className="flex min-h-[12px] flex-1 flex-col gap-2 overflow-y-auto px-2 py-2">
                {dependencies.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-white/10 px-2 py-4 text-center text-xs text-white/40">
                    Drop a task here
                  </li>
                ) : (
                  dependencies.map((dependency) => {
                    const overdue = isOverdue(dependency.deadline, dependency.status, today);
                    const dueToday = dependency.deadline === today && dependency.status !== "done";
                    const dragging = drag?.id === dependency.id;
                    return (
                      <li
                        key={dependency.id}
                        className={`rounded-xl border bg-white/[0.04] px-2 py-2 transition hover:bg-white/[0.07] ${
                          overdue ? "dep-urgent border-[#ff6b57]/70" : "border-white/10"
                        } ${dragging ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            draggable
                            aria-label={`Drag ${dependency.name} to another card`}
                            className="mt-0.5 cursor-grab touch-none text-white/35 hover:text-white/70 active:cursor-grabbing"
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
                              dependency.status === "done" ? "text-white/40 line-through" : "text-white"
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
                            className="max-w-[7.2rem] rounded-md border border-white/15 bg-[#0b1430] px-1 py-0.5 text-xs text-white/85"
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
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 pl-6 text-xs text-white/55">
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
                        {dependency.notes ? <p className="mt-1 line-clamp-2 pl-6 text-xs text-white/55">{dependency.notes}</p> : null}
                        {dependency.status === "hold" && dependency.holdReason ? (
                          <p className="mt-1 pl-6 text-xs text-[#ffd27a]">Hold: {dependency.holdReason}</p>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>
              <div className="px-2 pb-2">
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-white/55 hover:bg-white/5 hover:text-white"
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
          className="h-fit w-[300px] shrink-0 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-3 text-left text-sm font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white"
          onClick={() => setCardDialog("new")}
        >
          + Add a card
        </button>
      </section>
      {drag ? (
        <div
          className="glass-panel pointer-events-none fixed z-50 w-56 rounded-lg px-3 py-2 text-sm font-medium text-white"
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
        <div className="fixed inset-0 z-30 flex justify-end bg-[#02040b]/60 backdrop-blur-sm" onMouseDown={() => setNotesOpen(false)}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0a1228]/95 p-5 text-white shadow-xl"
            aria-label="Notifications"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Notifications</h2>
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
                <li className="text-sm text-white/50">No notifications yet.</li>
              ) : (
                board.notifications.map((item) => (
                  <li
                    key={item.id}
                    className={`rounded-xl border px-3 py-3 ${item.read ? "border-white/10" : "border-[#4d84ff]/60 bg-[#4d84ff]/10"}`}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-white/60">{item.body}</p>
                    {item.read ? null : (
                      <button
                        type="button"
                        className="mt-2 text-sm font-medium text-[#8fb3ff]"
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
