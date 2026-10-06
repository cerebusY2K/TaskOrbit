"use client";

import { useState } from "react";
import { EVERYONE, overviewSentence, summaryText, type PersonSummary } from "@/lib/member-summary";
import type { Dependency, Status } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const STATUS_DOTS: Record<Status, string> = {
  open: "#4d84ff",
  wip: "#a970ff",
  hold: "#ffb547",
  done: "#22b07d",
};

export function MemberSummary({
  summaries,
  selected,
  boardName,
  today,
  onSelect,
  onOpen,
}: {
  summaries: PersonSummary[];
  selected: string;
  boardName: string;
  today: string;
  onSelect: (key: string) => void;
  onOpen: (task: Dependency) => void;
}) {
  const [copied, setCopied] = useState(false);
  const person = summaries.find((summary) => summary.key === selected) ?? null;
  const withTasks = summaries.filter((summary) => summary.tasks.length > 0);
  const idle = summaries.filter((summary) => summary.kind === "person" && summary.tasks.length === 0);

  async function copy() {
    const text = summaryText(person ? [person] : summaries, boardName, today);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy the summary", text);
    }
  }

  return (
    <aside
      aria-label="People summary"
      className="glass-panel order-first mx-3 mb-3 flex max-h-[42vh] min-h-0 flex-col rounded-2xl sm:mx-5 lg:order-last lg:mb-4 lg:ml-0 lg:max-h-none lg:w-[380px] lg:shrink-0"
    >
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">People</h2>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
          onClick={copy}
        >
          {copied ? "Copied" : "Copy summary"}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 lg:flex-wrap">
        <Chip active={!person} label="Everyone" onClick={() => onSelect(EVERYONE)} />
        {summaries.map((summary) => (
          <Chip
            key={summary.key}
            active={person?.key === summary.key}
            label={summary.isYou ? `${summary.name} (you)` : summary.name}
            count={summary.tasks.length}
            alert={summary.overdue > 0}
            onClick={() => onSelect(summary.key)}
          />
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/10 px-4 py-3 text-sm leading-relaxed text-white/80">
        {person ? (
          <PersonDetail summary={person} onOpen={onOpen} />
        ) : (
          <div className="space-y-4">
            <p className="text-white/90">{overviewSentence(summaries)}</p>
            {withTasks.map((summary) => (
              <div key={summary.key}>
                <button
                  type="button"
                  className="font-semibold text-white hover:underline"
                  onClick={() => onSelect(summary.key)}
                >
                  {summary.isYou ? `${summary.name} (you)` : summary.name}
                </button>
                <p className="mt-0.5">{summary.sentences.slice(0, 4).join(" ")}</p>
              </div>
            ))}
            {idle.length ? (
              <p className="text-white/50">No tasks yet: {idle.map((summary) => summary.name).join(", ")}.</p>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}

function Chip({
  active,
  label,
  count,
  alert,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
        active ? "border-white/60 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
      }`}
      onClick={onClick}
    >
      <span className="max-w-[10rem] truncate">{label}</span>
      {count !== undefined ? (
        <span className={`rounded-full px-1.5 text-[11px] ${alert ? "bg-[#ff6b57]/25 text-[#ffb4a6]" : "bg-white/10 text-white/60"}`}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

function PersonDetail({ summary, onOpen }: { summary: PersonSummary; onOpen: (task: Dependency) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-white">{summary.isYou ? `${summary.name} (you)` : summary.name}</p>
        {summary.detail ? <p className="text-xs text-white/45">{summary.detail}</p> : null}
      </div>
      <div className="space-y-1.5">
        {summary.sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </div>
      {summary.tasks.length ? (
        <ul className="space-y-1 border-t border-white/10 pt-3">
          {summary.tasks.map(({ task, dates, overdue }) => (
            <li key={task.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.06]"
                onClick={() => onOpen(task)}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_DOTS[task.status] }} />
                <span className={`min-w-0 flex-1 truncate ${task.status === "done" ? "text-white/45 line-through" : "text-white"}`}>
                  {task.name}
                </span>
                <span className="shrink-0 text-xs text-white/50">
                  {STATUS_LABELS[task.status]}
                  {dates ? ` · ${dates}` : ""}
                </span>
                {overdue ? <span className="shrink-0 text-xs font-semibold text-[#ff8f7a]">Overdue</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
