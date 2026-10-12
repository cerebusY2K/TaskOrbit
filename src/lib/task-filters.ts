import { isOverdue } from "./domain";
import { shiftISO } from "./templates";
import type { Board, BoardPayload, Card, Dependency, Priority, Status } from "./types";
import { OWNER_ASSIGNEE } from "./types";

export const ANY_OWNER = "";
export const MY_TASKS = "me";
export const NO_OWNER = "none";

export type TaskFilter = {
  query: string;
  owner: string;
  priority: Priority | "";
  status: Status | "";
  label: string;
  overdue: boolean;
};

export const EMPTY_FILTER: TaskFilter = { query: "", owner: ANY_OWNER, priority: "", status: "", label: "", overdue: false };

export function filterIsActive(filter: TaskFilter) {
  return Boolean(filter.query.trim() || filter.owner || filter.priority || filter.status || filter.label || filter.overdue);
}

export function isUnassigned(task: Dependency) {
  return !task.assigneeMemberId && !task.taskOwner;
}

/** Whether the signed-in user is the assignee of a task on this board. */
export function isAssignedTo(task: Dependency, board: Board, uid: string) {
  if (!task.assigneeMemberId) return false;
  if (task.assigneeMemberId === OWNER_ASSIGNEE) return board.ownerId === uid;
  return (board.members ?? []).some((member) => member.id === task.assigneeMemberId && member.uid === uid);
}

export function matchesFilter(task: Dependency, filter: TaskFilter, isMine: (task: Dependency) => boolean, today: string) {
  if (filter.status && task.status !== filter.status) return false;
  if (filter.priority && task.priority !== filter.priority) return false;
  if (filter.overdue && !isOverdue(task.deadline, task.status, today)) return false;
  if (filter.label && !task.labels.some((label) => label.toLowerCase() === filter.label.toLowerCase())) return false;
  if (filter.owner === MY_TASKS && !isMine(task)) return false;
  if (filter.owner === NO_OWNER && !isUnassigned(task)) return false;
  if (filter.owner && filter.owner !== MY_TASKS && filter.owner !== NO_OWNER && task.assigneeMemberId !== filter.owner) return false;
  const query = filter.query.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    task.name,
    task.notes,
    task.taskOwner,
    task.waitingFor,
    task.blocks,
    task.nextAction,
    task.dependantOnLabel,
    task.holdReason,
    ...task.labels,
    ...task.checklist.map((item) => item.text),
  ];
  return haystack.some((text) => text?.toLowerCase().includes(query));
}

export function boardLabels(tasks: Dependency[]) {
  const seen = new Map<string, string>();
  for (const task of tasks) for (const label of task.labels) if (!seen.has(label.toLowerCase())) seen.set(label.toLowerCase(), label);
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

const LABEL_COLORS = ["#4c7dff", "#22b07d", "#a970ff", "#ff9f43", "#ff5c8a", "#2bb5c9", "#9ccc3c", "#ff6b57"];

export function labelColor(label: string) {
  let hash = 0;
  for (const char of label.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return LABEL_COLORS[hash % LABEL_COLORS.length];
}

export function checklistProgress(task: Dependency) {
  return { done: task.checklist.filter((item) => item.done).length, total: task.checklist.length };
}

export type MyTask = { task: Dependency; board: Board; card: Card };
export type MyTaskGroup = { key: "overdue" | "today" | "week" | "later" | "undated"; label: string; items: MyTask[] };

/** Open tasks assigned to the user, plus unassigned tasks on boards they own. */
export function myTasks(payload: BoardPayload, today: string): MyTaskGroup[] {
  const uid = payload.user.uid;
  const boards = new Map(payload.boards.map((board) => [board.id, board]));
  const cards = new Map(payload.cards.map((card) => [card.id, card]));
  const items: MyTask[] = [];
  for (const task of payload.dependencies) {
    if (task.status === "done") continue;
    const card = cards.get(task.cardId);
    const board = card ? boards.get(card.boardId) : undefined;
    if (!card || !board || card.isDone) continue;
    if (isAssignedTo(task, board, uid) || (board.ownerId === uid && isUnassigned(task))) items.push({ task, board, card });
  }
  items.sort(
    (a, b) =>
      (a.task.deadline ?? "9999").localeCompare(b.task.deadline ?? "9999") ||
      a.board.name.localeCompare(b.board.name) ||
      a.task.createdAt.localeCompare(b.task.createdAt),
  );
  const weekEnd = shiftISO(today, 7);
  const groups: MyTaskGroup[] = [
    { key: "overdue", label: "Overdue", items: [] },
    { key: "today", label: "Due today", items: [] },
    { key: "week", label: "Next 7 days", items: [] },
    { key: "later", label: "Later", items: [] },
    { key: "undated", label: "No due date", items: [] },
  ];
  const bucket = (key: MyTaskGroup["key"]) => groups.find((group) => group.key === key)!.items;
  for (const item of items) {
    const due = item.task.deadline;
    if (!due) bucket("undated").push(item);
    else if (isOverdue(due, item.task.status, today)) bucket("overdue").push(item);
    else if (due === today) bucket("today").push(item);
    else if (due <= weekEnd) bucket("week").push(item);
    else bucket("later").push(item);
  }
  return groups.filter((group) => group.items.length);
}
