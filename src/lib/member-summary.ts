import { isOverdue } from "./domain";
import { STATUS_LABELS, type Dependency, type Status } from "./types";

export const EVERYONE = "everyone";
export const UNASSIGNED = "unassigned";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COUNT_ORDER: { status: Status; label: string }[] = [
  { status: "wip", label: "in progress" },
  { status: "open", label: "open" },
  { status: "hold", label: "on hold" },
  { status: "done", label: "done" },
];

export type SummaryPerson = {
  id: string;
  name: string;
  detail?: string;
  isYou?: boolean;
};

export type PersonTask = {
  task: Dependency;
  dates: string | null;
  overdue: boolean;
};

export type PersonSummary = {
  key: string;
  name: string;
  detail?: string;
  isYou: boolean;
  kind: "person" | "typed" | "unassigned";
  tasks: PersonTask[];
  counts: Record<Status, number>;
  overdue: number;
  window: { start: string; end: string } | null;
  sentences: string[];
};

type Voice = { subject: string; have: string; their: string; unassigned: boolean };

export function shortDate(iso: string, today: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const label = `${MONTHS[month - 1]} ${day}`;
  return String(year) === today.slice(0, 4) ? label : `${label}, ${year}`;
}

export function taskDates(task: Pick<Dependency, "startDate" | "deadline">, today: string): string | null {
  const { startDate, deadline } = task;
  if (startDate && deadline) {
    return startDate === deadline
      ? shortDate(deadline, today)
      : `${shortDate(startDate, today)} – ${shortDate(deadline, today)}`;
  }
  if (startDate) return `from ${shortDate(startDate, today)}`;
  if (deadline) return `due ${shortDate(deadline, today)}`;
  return null;
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function voiceFor(summary: Pick<PersonSummary, "name" | "isYou" | "kind">): Voice {
  if (summary.kind === "unassigned") return { subject: "", have: "", their: "This", unassigned: true };
  if (summary.isYou) return { subject: "You", have: "have", their: "Your", unassigned: false };
  return { subject: summary.name, have: "has", their: "Their", unassigned: false };
}

function withDates(item: PersonTask): string {
  return item.dates ? `${item.task.name} (${item.dates})` : item.task.name;
}

function buildSentences(summary: Omit<PersonSummary, "sentences">, today: string): string[] {
  const voice = voiceFor(summary);
  const total = summary.tasks.length;
  if (total === 0) return [`${voice.subject} ${voice.have} no tasks on this board.`];

  const breakdown = joinAnd(
    COUNT_ORDER.filter(({ status }) => summary.counts[status] > 0).map(
      ({ status, label }) => `${summary.counts[status]} ${label}`,
    ),
  );
  const sentences: string[] = [];
  if (voice.unassigned) {
    sentences.push(`${plural(total, "task")} ${total === 1 ? "is" : "are"} not assigned to anyone: ${breakdown}.`);
  } else if (summary.counts.done === total) {
    sentences.push(`${voice.subject} finished all ${plural(total, "task")}.`);
  } else {
    sentences.push(`${voice.subject} ${voice.have} ${plural(total, "task")}: ${breakdown}.`);
  }

  if (summary.window) {
    const { start, end } = summary.window;
    sentences.push(
      start === end
        ? `${voice.their} open work is all on ${shortDate(start, today)}.`
        : `${voice.their} open work runs from ${shortDate(start, today)} to ${shortDate(end, today)}.`,
    );
  }

  const pending = summary.tasks.filter((item) => item.task.status !== "done");
  const overdue = pending.filter((item) => item.overdue);
  if (overdue.length) {
    sentences.push(
      `Overdue: ${joinAnd(overdue.map((item) => `${item.task.name} (was due ${shortDate(item.task.deadline!, today)})`))}.`,
    );
  }

  const working = pending.filter((item) => item.task.status === "wip");
  if (working.length) sentences.push(`Working on now: ${joinAnd(working.map(withDates))}.`);

  const weekEnd = addDays(today, 7);
  const dueSoon = pending.filter(
    (item) =>
      item.task.status !== "wip" &&
      !item.overdue &&
      item.task.deadline !== null &&
      item.task.deadline >= today &&
      item.task.deadline <= weekEnd,
  );
  if (dueSoon.length) {
    sentences.push(
      `Due this week: ${joinAnd(dueSoon.map((item) => `${item.task.name} (${shortDate(item.task.deadline!, today)})`))}.`,
    );
  }

  const next = pending
    .filter((item) => item.task.status === "open" && item.task.startDate !== null && item.task.startDate > today)
    .sort((a, b) => a.task.startDate!.localeCompare(b.task.startDate!))[0];
  if (next) sentences.push(`Next up: ${next.task.name}, starting ${shortDate(next.task.startDate!, today)}.`);

  const held = pending.filter((item) => item.task.status === "hold");
  if (held.length) {
    sentences.push(
      `On hold: ${joinAnd(held.map((item) => (item.task.holdReason ? `${item.task.name} (${item.task.holdReason})` : item.task.name)))}.`,
    );
  }

  const undated = pending.filter((item) => item.dates === null);
  if (undated.length) sentences.push(`No dates yet: ${joinAnd(undated.map((item) => item.task.name))}.`);

  if (summary.counts.done > 0 && summary.counts.done < total) {
    sentences.push(`${plural(summary.counts.done, "task")} done.`);
  }
  return sentences;
}

function sortKey(task: Dependency): string {
  return task.startDate ?? task.deadline ?? "9999-99-99";
}

export function summarizeMembers(people: SummaryPerson[], tasks: Dependency[], today: string): PersonSummary[] {
  const known = new Map(people.map((person) => [person.id, person]));
  const groups = new Map<string, { meta: Omit<PersonSummary, "tasks" | "counts" | "overdue" | "window" | "sentences">; tasks: Dependency[] }>();
  for (const person of people) {
    groups.set(person.id, {
      meta: { key: person.id, name: person.name, detail: person.detail, isYou: Boolean(person.isYou), kind: "person" },
      tasks: [],
    });
  }

  for (const task of tasks) {
    const typed = task.taskOwner?.trim();
    let key: string;
    if (task.assigneeMemberId && known.has(task.assigneeMemberId)) {
      key = task.assigneeMemberId;
    } else if (typed) {
      key = `typed:${typed.toLowerCase()}`;
      if (!groups.has(key)) {
        groups.set(key, { meta: { key, name: typed, isYou: false, kind: "typed" }, tasks: [] });
      }
    } else {
      key = UNASSIGNED;
      if (!groups.has(key)) {
        groups.set(key, { meta: { key, name: "Unassigned", isYou: false, kind: "unassigned" }, tasks: [] });
      }
    }
    groups.get(key)!.tasks.push(task);
  }

  const rank = { person: 0, typed: 1, unassigned: 2 };
  return [...groups.values()]
    .sort((a, b) => rank[a.meta.kind] - rank[b.meta.kind])
    .map(({ meta, tasks: own }) => {
      const sorted = [...own].sort((a, b) => sortKey(a).localeCompare(sortKey(b)) || a.name.localeCompare(b.name));
      const items = sorted.map((task) => ({
        task,
        dates: taskDates(task, today),
        overdue: isOverdue(task.deadline, task.status, today),
      }));
      const counts: Record<Status, number> = { open: 0, hold: 0, wip: 0, done: 0 };
      for (const task of sorted) counts[task.status] += 1;
      const open = sorted.filter((task) => task.status !== "done" && (task.startDate || task.deadline));
      const window = open.length
        ? {
            start: open.map((task) => (task.startDate ?? task.deadline)!).sort()[0],
            end: open.map((task) => (task.deadline ?? task.startDate)!).sort().reverse()[0],
          }
        : null;
      const base = { ...meta, tasks: items, counts, overdue: items.filter((item) => item.overdue).length, window };
      return { ...base, sentences: buildSentences(base, today) };
    });
}

export function overviewSentence(summaries: PersonSummary[]): string {
  const assigned = summaries.filter((summary) => summary.kind !== "unassigned" && summary.tasks.length > 0);
  const total = summaries.reduce((sum, summary) => sum + summary.tasks.length, 0);
  if (total === 0) return "No tasks on this board yet.";
  const open = summaries.reduce((sum, summary) => sum + summary.tasks.length - summary.counts.done, 0);
  const overdue = summaries.reduce((sum, summary) => sum + summary.overdue, 0);
  const unassigned = summaries.find((summary) => summary.kind === "unassigned")?.tasks.length ?? 0;
  const parts = [`${plural(total, "task")} across ${plural(assigned.length, "person").replace(/persons$/, "people")}`];
  parts.push(open ? `${open} still open` : "all done");
  if (overdue) parts.push(`${overdue} overdue`);
  let sentence = `${parts.join(", ")}.`;
  if (unassigned) sentence += ` ${plural(unassigned, "task")} ${unassigned === 1 ? "has" : "have"} no owner.`;
  return sentence;
}

export function summaryText(summaries: PersonSummary[], boardName: string, today: string): string {
  const lines = [`${boardName} · people summary · ${shortDate(today, today)}`, "", overviewSentence(summaries)];
  for (const summary of summaries) {
    lines.push("", `${summary.name}${summary.isYou ? " (you)" : ""}`);
    lines.push(...summary.sentences);
    for (const item of summary.tasks) {
      const parts = [item.task.name, STATUS_LABELS[item.task.status]];
      if (item.dates) parts.push(item.dates);
      if (item.overdue) parts.push("overdue");
      lines.push(`- ${parts.join(" · ")}`);
    }
  }
  return lines.join("\n");
}
