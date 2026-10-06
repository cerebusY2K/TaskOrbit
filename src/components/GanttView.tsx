"use client";

import { useEffect, useRef, useState } from "react";
import { isOverdue } from "@/lib/domain";
import type { Card, Dependency, Status } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const DAY = 36;
const ROW = 36;
const LABEL = 240;

const STATUS_COLORS: Record<Status, string> = {
  open: "#4d84ff",
  wip: "#a970ff",
  hold: "#ffb547",
  done: "#22b07d",
};

function dayNumber(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

function fromDayNumber(value: number) {
  return new Date(value * 86_400_000);
}

function span(task: Dependency) {
  const start = task.startDate ?? task.deadline;
  const end = task.deadline ?? task.startDate;
  if (!start || !end) return null;
  return { start: dayNumber(start), end: dayNumber(end) };
}

export function GanttView({
  cards,
  dependencies,
  today,
  ownerName,
  onOpen,
  emptyMessage = "No tasks on this board yet. Add tasks with From and To dates to see them on the timeline.",
}: {
  cards: Card[];
  dependencies: Dependency[];
  today: string;
  ownerName: (card: Card) => string;
  onOpen: (card: Card, task: Dependency) => void;
  emptyMessage?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [visibleDays, setVisibleDays] = useState(0);
  const todayDay = dayNumber(today);
  const groups = cards
    .map((card) => {
      const tasks = dependencies
        .filter((task) => task.cardId === card.id)
        .map((task) => ({ task, range: span(task) }));
      return {
        card,
        scheduled: tasks
          .filter((item): item is { task: Dependency; range: { start: number; end: number } } => item.range !== null)
          .sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end),
        unscheduled: tasks.filter((item) => item.range === null).map((item) => item.task),
      };
    })
    .filter((group) => group.scheduled.length + group.unscheduled.length > 0);

  const ranges = groups.flatMap((group) => group.scheduled.map((item) => item.range));
  const first = Math.min(todayDay, ...ranges.map((range) => range.start)) - 3;
  const last = Math.max(todayDay + 21, first + visibleDays - 1, ...ranges.map((range) => range.end + 7));
  const days = Array.from({ length: last - first + 1 }, (_, index) => first + index);
  const width = days.length * DAY;

  const months: { label: string; start: number; length: number }[] = [];
  for (const day of days) {
    const date = fromDayNumber(day);
    const label = date.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
    const current = months[months.length - 1];
    if (current && current.label === label) current.length += 1;
    else months.push({ label, start: day, length: 1 });
  }

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const measure = () => setVisibleDays(Math.ceil((node.clientWidth - LABEL) / DAY));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollLeft = Math.max(0, (todayDay - first - 3) * DAY);
  }, [todayDay, first]);

  const unscheduled = groups.flatMap((group) => group.unscheduled.map((task) => ({ card: group.card, task })));

  if (groups.length === 0) {
    return (
      <div className="min-w-0 flex-1 px-3 sm:px-5">
        <div className="glass-panel rounded-2xl px-5 py-10 text-center text-sm text-white/60">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-3 pb-4 sm:px-5">
      <div className="glass-panel flex min-h-0 overflow-hidden rounded-2xl">
        <div ref={scroller} className="relative min-h-0 flex-1 overflow-auto">
          <div className="relative" style={{ width: LABEL + width }}>
            <div className="sticky top-0 z-20 flex border-b border-white/10 bg-[#0b1430]/95 backdrop-blur">
              <div
                className="sticky left-0 z-30 shrink-0 border-r border-white/10 bg-[#0b1430] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/50"
                style={{ width: LABEL }}
              >
                Task
              </div>
              <div style={{ width }}>
                <div className="flex h-6">
                  {months.map((month) => (
                    <div
                      key={month.start}
                      className="truncate border-l border-white/10 px-2 text-xs font-medium leading-6 text-white/70"
                      style={{ width: month.length * DAY }}
                    >
                      {month.label}
                    </div>
                  ))}
                </div>
                <div className="flex h-6">
                  {days.map((day) => {
                    const date = fromDayNumber(day);
                    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
                    return (
                      <div
                        key={day}
                        className={`text-center text-[11px] leading-6 ${
                          day === todayDay ? "font-semibold text-[#ff8f7a]" : weekend ? "text-white/35" : "text-white/55"
                        }`}
                        style={{ width: DAY }}
                      >
                        {date.getUTCDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="relative">
              <div aria-hidden className="pointer-events-none absolute inset-y-0 flex" style={{ left: LABEL, width }}>
                {days.map((day) => {
                  const weekday = fromDayNumber(day).getUTCDay();
                  return (
                    <div
                      key={day}
                      className={`h-full border-l border-white/[0.04] ${weekday === 0 || weekday === 6 ? "bg-white/[0.025]" : ""}`}
                      style={{ width: DAY }}
                    />
                  );
                })}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[#ff8f7a]/80"
                style={{ left: LABEL + (todayDay - first) * DAY + DAY / 2 }}
              />

              {groups.map((group) =>
                group.scheduled.length === 0 ? null : (
                  <div key={group.card.id}>
                    <div className="flex h-8 items-center">
                      <div
                        className="sticky left-0 z-10 flex h-full shrink-0 items-center gap-2 border-r border-white/10 bg-[#0d1733] px-3 text-xs font-semibold uppercase tracking-wide text-white/70"
                        style={{ width: LABEL }}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: group.card.color }} />
                        <span className="truncate">{ownerName(group.card)}</span>
                      </div>
                    </div>
                    {group.scheduled.map(({ task, range }) => {
                      const overdue = isOverdue(task.deadline, task.status, today);
                      const left = (range.start - first) * DAY + 3;
                      const barWidth = (range.end - range.start + 1) * DAY - 6;
                      const color = STATUS_COLORS[task.status];
                      return (
                        <div key={task.id} className="relative flex items-center" style={{ height: ROW }}>
                          <button
                            type="button"
                            className="sticky left-0 z-10 flex h-full shrink-0 items-center border-r border-white/10 bg-[#0b1430] px-3 text-left text-sm text-white/85 hover:text-white"
                            style={{ width: LABEL }}
                            onClick={() => onOpen(group.card, task)}
                          >
                            <span className={`truncate ${task.status === "done" ? "text-white/45 line-through" : ""}`}>
                              {task.name}
                            </span>
                          </button>
                          <div className="relative h-full" style={{ width }}>
                            <button
                              type="button"
                              title={`${task.name} · ${STATUS_LABELS[task.status]}`}
                              aria-label={`${task.name}, ${STATUS_LABELS[task.status]}`}
                              className={`absolute top-1.5 flex items-center overflow-hidden rounded-md px-2 text-left text-xs font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:brightness-110 ${
                                overdue ? "ring-2 ring-[#ff6b57]" : ""
                              } ${task.status === "done" ? "opacity-60" : ""}`}
                              style={{
                                left,
                                width: barWidth,
                                height: ROW - 12,
                                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                              }}
                              onClick={() => onOpen(group.card, task)}
                            >
                              {barWidth > 80 ? <span className="truncate">{task.name}</span> : null}
                            </button>
                            {barWidth <= 80 ? (
                              <span
                                className="pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-white/60"
                                style={{ left: left + barWidth + 6 }}
                              >
                                {task.name}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55">
        {(Object.keys(STATUS_COLORS) as Status[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: STATUS_COLORS[status] }} />
            {STATUS_LABELS[status]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm ring-2 ring-[#ff6b57]" />
          Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-[#ff8f7a]" />
          Today
        </span>
      </div>

      {unscheduled.length ? (
        <div className="glass-panel rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            No dates yet · {unscheduled.length}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unscheduled.map(({ card, task }) => (
              <button
                key={task.id}
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                onClick={() => onOpen(card, task)}
              >
                {task.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
