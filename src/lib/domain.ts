import { CARD_COLORS, PRIORITIES, STATUSES, type Priority, type Status } from "./types";
import { BoardError } from "./errors";
import type { Dependency } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function assertEmail(value: unknown, label = "Email"): string {
  if (typeof value !== "string" || !EMAIL_PATTERN.test(value.trim())) {
    throw new BoardError(`${label} must be a valid email address.`);
  }
  return normalizeEmail(value);
}

export function assertName(value: unknown, label: string, max = 80): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BoardError(`${label} is required.`);
  }
  const name = value.trim();
  if (name.length > max) {
    throw new BoardError(`${label} must be ${max} characters or fewer.`);
  }
  return name;
}

export function assertColor(value: unknown, label = "color"): string {
  if (typeof value !== "string" || !COLOR_PATTERN.test(value.trim())) {
    throw new BoardError(`Pick a ${label}.`);
  }
  return value.trim().toLowerCase();
}

export function assertPriority(value: unknown): Priority | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !PRIORITIES.includes(value as Priority)) {
    throw new BoardError("Priority must be low, medium, high, or urgent.");
  }
  return value as Priority;
}

export function optionalText(value: unknown, label: string, max = 200): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new BoardError(`${label} must be text.`);
  const text = value.trim();
  if (!text) return null;
  if (text.length > max) throw new BoardError(`${label} must be ${max} characters or fewer.`);
  return text;
}

export function assertStatus(value: unknown): Status {
  if (typeof value !== "string" || !STATUSES.includes(value as Status)) {
    throw new BoardError("Status must be open, hold, wip, or done.");
  }
  return value as Status;
}

export function assertDeadline(value: unknown, label = "Deadline"): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    throw new BoardError(`${label} must be a date.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new BoardError(`${label} must be a real date.`);
  }
  return value;
}

export type DependencyDraft = {
  name: string;
  startDate: string | null;
  deadline: string | null;
  dependantOnId: string | null;
  dependantOnLabel: string | null;
  status: Status;
  holdReason: string | null;
  taskOwner: string | null;
  priority: Priority | null;
  waitingFor: string | null;
  blocks: string | null;
  nextAction: string | null;
  notes: string | null;
};

export function assertDependencyDraft(
  input: {
    name?: unknown;
    startDate?: unknown;
    deadline?: unknown;
    dependantOnId?: unknown;
    dependantOnLabel?: unknown;
    status?: unknown;
    holdReason?: unknown;
    taskOwner?: unknown;
    priority?: unknown;
    waitingFor?: unknown;
    blocks?: unknown;
    nextAction?: unknown;
    notes?: unknown;
  },
  siblings: Dependency[],
  selfId: string | null,
): DependencyDraft {
  const name = assertName(input.name, "Task", 140);
  const startDate = assertDeadline(input.startDate, "From date");
  const deadline = assertDeadline(input.deadline, "To date");
  if (startDate && deadline && deadline < startDate) {
    throw new BoardError("The To date cannot be before the From date.");
  }
  const status = assertStatus(input.status ?? "open");
  let holdReason: string | null = null;
  if (status === "hold") {
    if (typeof input.holdReason !== "string" || !input.holdReason.trim()) {
      throw new BoardError("A reason is required when a dependency is on hold.");
    }
    holdReason = input.holdReason.trim();
    if (holdReason.length > 500) {
      throw new BoardError("Hold reason must be 500 characters or fewer.");
    }
  }

  let dependantOnId: string | null = null;
  let dependantOnLabel: string | null = null;
  if (typeof input.dependantOnId === "string" && input.dependantOnId) {
    if (selfId && input.dependantOnId === selfId) {
      throw new BoardError("A dependency cannot depend on itself.");
    }
    const target = siblings.find((item) => item.id === input.dependantOnId);
    if (!target) {
      throw new BoardError("The dependency it depends on was not found on this card.");
    }
    if (createsCycle(siblings, selfId, target.id)) {
      throw new BoardError("That would make a circular dependency.");
    }
    dependantOnId = target.id;
    dependantOnLabel = target.name;
  } else if (typeof input.dependantOnLabel === "string" && input.dependantOnLabel.trim()) {
    dependantOnLabel = input.dependantOnLabel.trim().slice(0, 140);
  }

  return {
    name,
    startDate,
    deadline,
    dependantOnId,
    dependantOnLabel,
    status,
    holdReason,
    taskOwner: optionalText(input.taskOwner, "Owner"),
    priority: assertPriority(input.priority),
    waitingFor: optionalText(input.waitingFor, "Waiting for"),
    blocks: optionalText(input.blocks, "Blocks"),
    nextAction: optionalText(input.nextAction, "Next action"),
    notes: optionalText(input.notes, "Notes", 2000),
  };
}

export function createsCycle(
  dependencies: Dependency[],
  selfId: string | null,
  dependantOnId: string | null,
): boolean {
  if (!dependantOnId) return false;
  const byId = new Map(dependencies.map((item) => [item.id, item]));
  const seen = new Set<string>();
  let current: string | null = dependantOnId;
  while (current) {
    if (selfId && current === selfId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    current = byId.get(current)?.dependantOnId ?? null;
  }
  return false;
}

export function todayISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isOverdue(
  deadline: string | null,
  status: Status,
  today = todayISO(),
): boolean {
  if (!deadline || status === "done") return false;
  return deadline < today;
}

export function defaultCardColor(): string {
  return CARD_COLORS[0];
}
