"use client";

import { useMemo, useState } from "react";
import { isOverdue, todayISO } from "@/lib/domain";
import { myTasks } from "@/lib/task-filters";
import type { Board, BoardPayload, Dependency } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { InstallButton } from "./InstallButton";
import { MyTasksPanel } from "./MyTasksPanel";
import { OrbitMark } from "./OrbitMark";
import { OrbitStage } from "./OrbitStage";
import { ThemePicker } from "./ThemePicker";
import { MobileMenu, mobileMenuRow } from "./MobileMenu";
import { useIsPhone } from "./useIsPhone";

type Item = {
  board: Board;
  open: number;
  overdue: number;
  tasks: Dependency[];
};

function buildItems(payload: BoardPayload): Item[] {
  const boards = [...payload.boards].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const today = todayISO();
  return boards.map((board) => {
    const cardIds = new Set(payload.cards.filter((card) => card.boardId === board.id).map((card) => card.id));
    const tasks = payload.dependencies.filter((item) => cardIds.has(item.cardId) && item.status !== "done");
    return {
      board,
      open: tasks.length,
      overdue: tasks.filter((item) => isOverdue(item.deadline, item.status, today)).length,
      tasks: tasks.slice(0, 3),
    };
  });
}

export function BoardOrbit({
  payload,
  onOpen,
  onOpenTask,
  onReload,
  onSignOut,
}: {
  payload: BoardPayload;
  onOpen: (boardId: string) => void;
  onOpenTask: (boardId: string, taskId: string) => void;
  onReload: () => Promise<void>;
  onSignOut: () => void;
}) {
  const [myTasksOpen, setMyTasksOpen] = useState(false);
  const items = useMemo(() => buildItems(payload), [payload]);
  const [opening, setOpening] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  function open(item: Item) {
    if (opening) return;
    setOpening(item.board.id);
    window.setTimeout(() => onOpen(item.board.id), 420);
  }

  const phone = useIsPhone();
  const firstName = payload.user.name.split(" ")[0] || payload.user.name;
  const today = todayISO();
  const myOverdue = myTasks(payload, today).find((group) => group.key === "overdue")?.items.length ?? 0;

  return (
    <div className="orbit-space relative flex h-[100dvh] min-h-0 flex-col overflow-hidden text-white">
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <OrbitMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight">TaskOrb</p>
            <p className="truncate text-sm text-white/60">
              {settled && !phone ? "Hover a board to pause it, click to open" : `Welcome back, ${firstName}`}
            </p>
          </div>
        </div>
        <MobileMenu
          title="TaskOrb"
          items={[
            { label: "My tasks", count: myOverdue, alert: true, onSelect: () => setMyTasksOpen(true) },
            ...(payload.isAdmin ? [{ label: "Visitors", href: "/admin" }] : []),
            { label: "Sign out", onSelect: onSignOut },
          ]}
          footer={<InstallButton className={mobileMenuRow} />}
        />
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
            onClick={() => setMyTasksOpen(true)}
          >
            My tasks
            {myOverdue > 0 ? (
              <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-[11px] font-semibold text-on-accent" title="Overdue">
                {myOverdue}
              </span>
            ) : null}
          </button>
          <InstallButton className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-on-accent transition hover:bg-accent-strong" />
          <ThemePicker className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20" />
          {payload.isAdmin ? (
            <a href="/admin" className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20">
              Visitors
            </a>
          ) : null}
          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
            onClick={onSignOut}
          >
            Sign out
          </button>
        </div>
      </header>

      {phone ? (
        <PhoneBoardList items={items} uid={payload.user.uid} today={today} onOpen={(item) => onOpen(item.board.id)} />
      ) : (
        <>
          <OrbitStage
            entries={items.map((item) => ({ key: item.board.id, color: item.board.color }))}
            fadeOnOpen
            className={opening ? "opacity-0" : ""}
            onSettled={() => setSettled(true)}
            onOpen={(index) => {
              setOpening(items[index]!.board.id);
              onOpen(items[index]!.board.id);
            }}
            renderItem={(index, isHovered) => {
              const item = items[index]!;
              return (
                <>
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white/25" style={{ background: item.board.color }} />
                    <span className="truncate text-sm font-semibold sm:text-base">{item.board.name}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-white/55 sm:text-sm">
                    {item.open} open{item.overdue ? ` · ${item.overdue} overdue` : ""}
                    {item.board.ownerId !== payload.user.uid ? ` · shared by ${item.board.ownerName ?? "someone"}` : ""}
                  </span>
                  {isHovered && item.tasks.length ? (
                    <ul className="mt-2 grid gap-1 border-t border-white/10 pt-2">
                      {item.tasks.map((task) => (
                        <li key={task.id} className="flex items-center justify-between gap-3 text-sm">
                          <span
                            className={`truncate ${isOverdue(task.deadline, task.status, today) ? "text-danger-soft" : "text-white/85"}`}
                          >
                            {task.name}
                          </span>
                          <span className="shrink-0 text-white/45">{STATUS_LABELS[task.status]}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              );
            }}
          />

          <nav
            aria-label="Boards"
            className={`relative z-10 flex flex-wrap justify-center gap-2 px-4 pb-6 pt-2 transition-opacity duration-500 ${
              settled && !opening ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {items.map((item) => (
              <button
                key={item.board.id}
                type="button"
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/85 transition hover:bg-white/20"
                onClick={() => open(item)}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: item.board.color }} />
                {item.board.name}
              </button>
            ))}
          </nav>
        </>
      )}
      {myTasksOpen ? (
        <MyTasksPanel
          payload={payload}
          today={today}
          onClose={() => setMyTasksOpen(false)}
          onChanged={onReload}
          onOpen={(item) => onOpenTask(item.board.id, item.task.id)}
        />
      ) : null}
    </div>
  );
}

function PhoneBoardList({ items, uid, today, onOpen }: { items: Item[]; uid: string; today: string; onOpen: (item: Item) => void }) {
  const open = items.reduce((sum, item) => sum + item.open, 0);
  const overdue = items.reduce((sum, item) => sum + item.overdue, 0);
  return (
    <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <div className="flex items-end justify-between gap-3 pb-3 pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your boards</h1>
        <p className="pb-1 text-sm text-white/55">
          {open} open{overdue ? <span className="text-danger-soft"> · {overdue} overdue</span> : null}
        </p>
      </div>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.board.id}>
            <button
              type="button"
              className="glass-panel block w-full rounded-2xl p-4 text-left transition active:scale-[0.99]"
              style={{ borderLeft: `4px solid ${item.board.color}` }}
              onClick={() => onOpen(item)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold">{item.board.name}</span>
                  <span className="mt-0.5 block text-sm text-white/55">
                    {item.open} open
                    {item.overdue ? <span className="text-danger-soft"> · {item.overdue} overdue</span> : null}
                    {item.board.ownerId !== uid ? ` · shared by ${item.board.ownerName ?? "someone"}` : ""}
                  </span>
                </span>
                <span aria-hidden className="text-xl text-white/35">
                  ›
                </span>
              </span>
              {item.tasks.length ? (
                <span className="mt-3 grid gap-1.5 border-t border-white/10 pt-3">
                  {item.tasks.map((task) => (
                    <span key={task.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className={`truncate ${isOverdue(task.deadline, task.status, today) ? "text-danger-soft" : "text-white/80"}`}>
                        {task.name}
                      </span>
                      <span className="shrink-0 text-xs text-white/45">{STATUS_LABELS[task.status]}</span>
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
