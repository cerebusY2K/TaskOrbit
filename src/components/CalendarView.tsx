"use client";

import { useState } from "react";
import { addDaysISO, isOverdue } from "@/lib/domain";
import type { Card, Dependency } from "@/lib/types";
import { PRIORITIES } from "@/lib/types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthStart(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

function shiftMonth(start: string, months: number) {
  const [year, month] = start.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return date.toISOString().slice(0, 10);
}

/** Every day shown in the month grid, Monday first, padded to whole weeks. */
function gridDays(start: string) {
  const [year, month] = start.split("-").map(Number);
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const total = Math.ceil((lead + length) / 7) * 7;
  const first = addDaysISO(start, -lead);
  return Array.from({ length: total }, (_, index) => addDaysISO(first, index));
}

const rank = (task: Dependency) =>
  (task.status === "done" ? 10 : 0) + (task.priority ? PRIORITIES.length - PRIORITIES.indexOf(task.priority) : PRIORITIES.length + 1);

export function CalendarView({
  tasks,
  cards,
  today,
  canEdit,
  onOpen,
  onReschedule,
}: {
  tasks: Dependency[];
  cards: Card[];
  today: string;
  canEdit: (task: Dependency) => boolean;
  onOpen: (task: Dependency) => void;
  onReschedule: (task: Dependency, deadline: string) => Promise<void>;
}) {
  const [start, setStart] = useState(() => monthStart(today));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const days = gridDays(start);
  const month = start.slice(0, 7);
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const byDay = new Map<string, Dependency[]>();
  for (const task of tasks) {
    if (!task.deadline) continue;
    const list = byDay.get(task.deadline) ?? [];
    list.push(task);
    byDay.set(task.deadline, list);
  }
  for (const list of byDay.values()) list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const undated = tasks.filter((task) => !task.deadline).length;
  const inMonth = days.filter((day) => day.startsWith(month) && byDay.has(day));
  const [year, monthIndex] = start.split("-").map(Number);
  const title = `${MONTHS[monthIndex - 1]} ${year}`;

  const chip = (task: Dependency, compact: boolean) => {
    const card = cardById.get(task.cardId);
    const overdue = isOverdue(task.deadline, task.status, today);
    const editable = canEdit(task) && !card?.isDone;
    return (
      <button
        key={task.id}
        type="button"
        draggable={editable}
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", task.id);
          event.dataTransfer.effectAllowed = "move";
          setDragId(task.id);
        }}
        onDragEnd={() => {
          setDragId(null);
          setOverDay(null);
        }}
        onClick={() => onOpen(task)}
        title={`${task.name}${card ? ` · ${card.name}` : ""}`}
        className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition hover:bg-white/15 ${
          compact ? "text-[11px]" : "text-sm"
        } ${overdue ? "bg-[#ff6b57]/15 text-[#ffb4a6]" : "bg-white/[0.07] text-white/85"} ${
          task.status === "done" ? "line-through opacity-50" : ""
        } ${dragId === task.id ? "opacity-40" : ""}`}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: card?.color ?? "#8899aa" }} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{task.name}</span>
        {task.repeat ? (
          <span aria-label="Repeats" className="shrink-0 text-white/50">
            ↻
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <section className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-6 sm:px-5" aria-label="Calendar">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-display text-xl font-semibold text-white">{title}</h2>
        <button type="button" aria-label="Previous month" className={navBtn} onClick={() => setStart(shiftMonth(start, -1))}>
          ‹
        </button>
        <button type="button" aria-label="Next month" className={navBtn} onClick={() => setStart(shiftMonth(start, 1))}>
          ›
        </button>
        <button type="button" className={`${navBtn} px-3`} onClick={() => setStart(monthStart(today))}>
          Today
        </button>
        <p className="ml-auto text-xs text-white/50">
          {undated ? `${undated} task${undated === 1 ? "" : "s"} without a To date not shown. ` : ""}
          <span className="hidden sm:inline">Drag a task to another day to change its dates.</span>
        </p>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-white/10 sm:block">
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.04] text-xs text-white/55">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-1.5">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const items = byDay.get(day) ?? [];
            const outside = !day.startsWith(month);
            return (
              <div
                key={day}
                onDragOver={(event) => {
                  if (!dragId) return;
                  event.preventDefault();
                  setOverDay(day);
                }}
                onDragLeave={() => setOverDay((current) => (current === day ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData("text/plain") || dragId;
                  setDragId(null);
                  setOverDay(null);
                  const task = tasks.find((item) => item.id === id);
                  if (task && task.deadline !== day) void onReschedule(task, day);
                }}
                className={`min-h-[104px] border-b border-r border-white/[0.07] p-1.5 ${
                  outside ? "bg-black/20 text-white/30" : "text-white/70"
                } ${overDay === day ? "bg-[#4d84ff]/20" : ""}`}
              >
                <div
                  className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs ${
                    day === today ? "bg-[#4d84ff] font-semibold text-white" : ""
                  }`}
                >
                  {Number(day.slice(8))}
                </div>
                <div className="grid max-h-[120px] gap-1 overflow-y-auto">{items.map((task) => chip(task, true))}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:hidden">
        {inMonth.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-6 text-center text-sm text-white/55">
            Nothing is due in {title}.
          </p>
        ) : (
          inMonth.map((day) => (
            <div key={day} className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
              <p className={`mb-1.5 text-xs font-medium ${day === today ? "text-[#8fb3ff]" : "text-white/60"}`}>
                {WEEKDAYS[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7]} {Number(day.slice(8))}
                {day === today ? " · Today" : ""}
              </p>
              <div className="grid gap-1">{(byDay.get(day) ?? []).map((task) => chip(task, false))}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const navBtn =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white/5 text-sm text-white/75 transition hover:bg-white/15 hover:text-white";
