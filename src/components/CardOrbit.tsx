"use client";

import { useEffect, useState } from "react";
import { isOverdue } from "@/lib/domain";
import { taskDates } from "@/lib/member-summary";
import type { Card, Dependency, Status } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { OrbitStage } from "./OrbitStage";

const STATUS_COLORS: Record<Status, string> = {
  open: "#4d84ff",
  wip: "#a970ff",
  hold: "#ffb547",
  done: "#22b07d",
};
const OVERDUE = "#ff6b57";

export function CardOrbit({
  boardName,
  cards,
  today,
  tasksFor,
  cardLabel,
  canAddTask,
  onOpenTask,
  onAddTask,
  onAddCard,
  onEditCard,
}: {
  boardName: string;
  cards: Card[];
  today: string;
  tasksFor: (card: Card) => Dependency[];
  cardLabel: (card: Card) => string;
  canAddTask: (card: Card) => boolean;
  onOpenTask: (card: Card, task: Dependency) => void;
  onAddTask: (card: Card) => void;
  onAddCard?: () => void;
  onEditCard?: (card: Card) => void;
}) {
  const [cardId, setCardId] = useState<string | null>(null);
  const card = cards.find((item) => item.id === cardId) ?? null;

  useEffect(() => {
    if (!card) return;
    const back = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("[role=dialog]")) setCardId(null);
    };
    window.addEventListener("keydown", back);
    return () => window.removeEventListener("keydown", back);
  }, [card]);

  if (card) {
    const tasks = tasksFor(card);
    const open = tasks.filter((task) => task.status !== "done").length;
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative z-10 flex flex-wrap items-center gap-2 px-3 sm:px-5">
          <button
            type="button"
            className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            onClick={() => setCardId(null)}
          >
            ← All cards
          </button>
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: card.color, boxShadow: `0 0 10px ${card.color}` }} />
            {cardLabel(card)}
            <span className="font-normal text-white/45">
              {card.isDone ? `${tasks.length} finished` : `${open} open`}
            </span>
          </span>
          {canAddTask(card) ? (
            <button
              type="button"
              className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              onClick={() => onAddTask(card)}
            >
              + Add a task
            </button>
          ) : null}
          {onEditCard && !card.isDone ? (
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-sm text-white/55 transition hover:bg-white/10 hover:text-white"
              onClick={() => onEditCard(card)}
            >
              Edit card
            </button>
          ) : null}
        </div>
        <OrbitStage
          key={card.id}
          entries={tasks.map((task) => ({
            key: task.id,
            color: isOverdue(task.deadline, task.status, today) ? OVERDUE : STATUS_COLORS[task.status],
          }))}
          onOpen={(index) => onOpenTask(card, tasks[index]!)}
          center={
            tasks.length ? (
              <p className="max-w-[10rem] truncate text-xs font-medium uppercase tracking-wide text-white/40">
                {cardLabel(card)}
              </p>
            ) : (
              <p className="w-56 text-sm text-white/55">
                {card.isDone ? "Tasks marked done land here." : "No tasks on this card yet."}
              </p>
            )
          }
          renderItem={(index, hovered) => <TaskChip task={tasks[index]!} today={today} expanded={hovered} />}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="relative z-10 flex min-h-[34px] flex-wrap items-center gap-2 px-3 sm:px-5">
        <span className="text-sm text-white/50">Click a card to see its tasks in orbit</span>
        {onAddCard ? (
          <button
            type="button"
            className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            onClick={onAddCard}
          >
            + Add a card
          </button>
        ) : null}
      </div>
      <OrbitStage
        key="cards"
        entries={cards.map((item) => ({ key: item.id, color: item.color }))}
        fadeOnOpen
        onOpen={(index) => setCardId(cards[index]!.id)}
        center={
          <p className="max-w-[10rem] truncate text-xs font-medium uppercase tracking-wide text-white/40">{boardName}</p>
        }
        renderItem={(index, hovered) => {
          const item = cards[index]!;
          const tasks = tasksFor(item);
          const pending = tasks.filter((task) => task.status !== "done");
          const overdue = pending.filter((task) => isOverdue(task.deadline, task.status, today)).length;
          return (
            <>
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white/25" style={{ background: item.color }} />
                <span className="truncate text-sm font-semibold sm:text-base">{cardLabel(item)}</span>
              </span>
              <span className="mt-0.5 block text-xs text-white/55 sm:text-sm">
                {item.isDone ? `${tasks.length} finished` : `${pending.length} open`}
                {overdue ? ` · ${overdue} overdue` : ""}
              </span>
              {hovered && tasks.length ? (
                <ul className="mt-2 grid gap-1 border-t border-white/10 pt-2">
                  {(item.isDone ? tasks : pending).slice(0, 3).map((task) => (
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
    </div>
  );
}

function TaskChip({ task, today, expanded }: { task: Dependency; today: string; expanded: boolean }) {
  const overdue = isOverdue(task.deadline, task.status, today);
  const color = overdue ? OVERDUE : STATUS_COLORS[task.status];
  const dates = taskDates(task, today);
  return (
    <>
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20" style={{ background: color }} />
        <span className={`truncate text-sm font-semibold ${task.status === "done" ? "text-white/50 line-through" : ""}`}>
          {task.name}
        </span>
      </span>
      <span className="mt-0.5 block truncate text-xs text-white/55">
        {overdue ? <span className="font-medium text-[#ff9b85]">Overdue · </span> : null}
        {STATUS_LABELS[task.status]}
        {dates ? ` · ${dates}` : ""}
      </span>
      {expanded ? (
        <span className="mt-2 grid gap-0.5 border-t border-white/10 pt-2 text-xs text-white/65">
          {task.taskOwner ? <span>Owner {task.taskOwner}</span> : null}
          {task.status === "hold" && task.holdReason ? <span className="text-[#ffd27a]">Hold: {task.holdReason}</span> : null}
          {task.nextAction ? <span>Next: {task.nextAction}</span> : null}
          {task.waitingFor ? <span>Waiting for {task.waitingFor}</span> : null}
          <span className="text-white/40">Click to open</span>
        </span>
      ) : null}
    </>
  );
}
