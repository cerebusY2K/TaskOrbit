"use client";

import { useMemo, useState } from "react";
import { isOverdue, todayISO } from "@/lib/domain";
import type { Board, BoardPayload, Dependency } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { InstallButton } from "./InstallButton";
import { OrbitMark } from "./OrbitMark";
import { OrbitStage } from "./OrbitStage";

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
  onSignOut,
}: {
  payload: BoardPayload;
  onOpen: (boardId: string) => void;
  onSignOut: () => void;
}) {
  const items = useMemo(() => buildItems(payload), [payload]);
  const [opening, setOpening] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  function open(item: Item) {
    if (opening) return;
    setOpening(item.board.id);
    window.setTimeout(() => onOpen(item.board.id), 420);
  }

  const firstName = payload.user.name.split(" ")[0] || payload.user.name;
  const today = todayISO();

  return (
    <div className="orbit-space relative flex h-screen min-h-0 flex-col overflow-hidden text-white">
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <OrbitMark className="h-9 w-9" />
          <div>
            <p className="text-lg font-semibold tracking-tight">TaskOrb</p>
            <p className="text-sm text-white/60">
              {settled ? "Hover a board to pause it, click to open" : `Welcome back, ${firstName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InstallButton className="rounded-md bg-[#4d84ff] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#3b70f0]" />
          {payload.isAdmin ? (
            <a
              href="/admin"
              className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
            >
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
                        className={`truncate ${isOverdue(task.deadline, task.status, today) ? "text-[#ff9b85]" : "text-white/85"}`}
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
    </div>
  );
}
