import { MAX_CHECKLIST, MAX_LABELS, todayISO } from "./domain";
import type { Priority, Status } from "./types";

export const IMPORT_MAX_CARDS = 40;
export const IMPORT_MAX_TASKS = 500;

export type ImportedTask = {
  name: string;
  status: Status;
  holdReason: string | null;
  startDate: string | null;
  deadline: string | null;
  priority: Priority | null;
  labels: string[];
  checklist: { text: string; done: boolean }[];
  notes: string | null;
};

export type ImportedBoard = {
  name: string;
  cards: { name: string; tasks: ImportedTask[] }[];
  /** Finished tasks that go straight onto the board's Done card. */
  done: ImportedTask[];
};

export type ImportResult = { board: ImportedBoard; source: "Trello" | "CSV"; warnings: string[] };

const DONE_LIST = /^(done|complete|completed|finished|shipped|closed|archive)\b/i;
const HOLD_REASON = "Marked on hold before import.";

const clip = (value: string, max: number) => {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

const clipNotes = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();
  return text.length > 2000 ? `${text.slice(0, 1999)}…` : text;
};

function cleanLabels(values: string[]) {
  const labels: string[] = [];
  for (const raw of values) {
    const label = clip(raw, 24);
    if (label && !labels.some((item) => item.toLowerCase() === label.toLowerCase())) labels.push(label);
  }
  return labels.slice(0, MAX_LABELS);
}

function cleanTask(task: ImportedTask): ImportedTask {
  const startDate = task.startDate && task.deadline && task.startDate > task.deadline ? null : task.startDate;
  return {
    ...task,
    startDate,
    checklist: task.checklist
      .map((item) => ({ text: clip(item.text, 140), done: item.done }))
      .filter((item) => item.text)
      .slice(0, MAX_CHECKLIST),
  };
}

/** Caps the board to the import limits and records what was left out. */
function finish(board: ImportedBoard, warnings: string[]): ImportedBoard {
  let cards = board.cards.filter((card) => card.tasks.length || board.cards.length <= IMPORT_MAX_CARDS);
  if (cards.length > IMPORT_MAX_CARDS) {
    const extra = cards.slice(IMPORT_MAX_CARDS - 1);
    cards = [
      ...cards.slice(0, IMPORT_MAX_CARDS - 1),
      { name: "More imported tasks", tasks: extra.flatMap((card) => card.tasks) },
    ];
    warnings.push(`Only ${IMPORT_MAX_CARDS} cards fit on a board, so ${extra.length} lists were combined into "More imported tasks".`);
  }
  let room = IMPORT_MAX_TASKS;
  let dropped = 0;
  const take = (tasks: ImportedTask[]) => {
    const kept = tasks.slice(0, Math.max(0, room));
    dropped += tasks.length - kept.length;
    room -= kept.length;
    return kept.map(cleanTask);
  };
  const capped = cards.map((card) => ({ name: clip(card.name, 80) || "Tasks", tasks: take(card.tasks) }));
  const done = take(board.done);
  if (dropped) warnings.push(`Only the first ${IMPORT_MAX_TASKS} tasks are imported. ${dropped} were left out.`);
  return { name: clip(board.name, 80) || "Imported board", cards: capped, done };
}

function localDay(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : todayISO(date);
}

type TrelloItem = { id?: string; name?: string; closed?: boolean; pos?: number };
type TrelloCard = TrelloItem & {
  desc?: string;
  idList?: string;
  due?: string | null;
  start?: string | null;
  dueComplete?: boolean;
  idLabels?: string[];
};

export function isTrelloExport(value: unknown): boolean {
  const data = value as { lists?: unknown; cards?: unknown } | null;
  return Boolean(data && Array.isArray(data.lists) && Array.isArray(data.cards));
}

export function parseTrelloExport(value: unknown): ImportResult {
  if (!isTrelloExport(value)) {
    throw new Error("This is not a Trello board export. In Trello, open the board menu, then Print, export and share, then Export as JSON.");
  }
  const data = value as {
    name?: string;
    lists: TrelloItem[];
    cards: TrelloCard[];
    labels?: (TrelloItem & { color?: string | null })[];
    checklists?: { idCard?: string; pos?: number; checkItems?: { name?: string; state?: string; pos?: number }[] }[];
  };
  const warnings: string[] = [];
  const byPos = (a: TrelloItem, b: TrelloItem) => (a.pos ?? 0) - (b.pos ?? 0);
  const labelNames = new Map(
    (data.labels ?? []).map((label) => [
      label.id,
      label.name?.trim() || (label.color ? label.color[0].toUpperCase() + label.color.slice(1) : ""),
    ]),
  );
  const checklists = new Map<string, { text: string; done: boolean }[]>();
  for (const list of [...(data.checklists ?? [])].sort(byPos)) {
    if (!list.idCard) continue;
    const items = [...(list.checkItems ?? [])]
      .sort(byPos)
      .map((item) => ({ text: item.name ?? "", done: item.state === "complete" }));
    checklists.set(list.idCard, [...(checklists.get(list.idCard) ?? []), ...items]);
  }

  const lists = data.lists.filter((list) => !list.closed).sort(byPos);
  const openLists = new Set(lists.map((list) => list.id));
  const cards = data.cards.filter((card) => !card.closed && openLists.has(card.idList)).sort(byPos);
  const archived = data.cards.length - cards.length;
  if (archived) warnings.push(`${archived} archived card${archived === 1 ? " was" : "s were"} skipped.`);

  const board: ImportedBoard = { name: data.name ?? "Trello board", cards: [], done: [] };
  for (const list of lists) {
    const doneList = DONE_LIST.test(list.name?.trim() ?? "");
    const tasks: ImportedTask[] = [];
    for (const card of cards.filter((item) => item.idList === list.id)) {
      const name = clip(card.name ?? "", 140);
      if (!name) continue;
      const task: ImportedTask = {
        name,
        status: doneList || card.dueComplete ? "done" : "open",
        holdReason: null,
        startDate: localDay(card.start),
        deadline: localDay(card.due),
        priority: null,
        labels: cleanLabels((card.idLabels ?? []).map((id) => labelNames.get(id) ?? "")),
        checklist: checklists.get(card.id ?? "") ?? [],
        notes: clipNotes(card.desc),
      };
      if (doneList || task.status === "done") board.done.push(task);
      else tasks.push(task);
    }
    if (!doneList) board.cards.push({ name: list.name ?? "List", tasks });
  }
  return { board: finish(board, warnings), source: "Trello", warnings };
}

/** RFC 4180 rows: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsvRows(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && !field) {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function detectDelimiter(text: string) {
  const header = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((char) => [char, header.split(char).length] as const);
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

const COLUMNS = {
  name: ["task", "name", "title", "task name", "card name", "summary", "subject"],
  card: ["card", "list", "list name", "column", "section", "section/column", "stage", "group", "bucket", "category"],
  status: ["status", "state", "progress"],
  deadline: ["due", "due date", "deadline", "to", "to date", "end", "end date", "due on"],
  startDate: ["start", "start date", "from", "from date", "starts on", "start on"],
  priority: ["priority", "importance"],
  labels: ["labels", "label", "tags", "tag"],
  notes: ["notes", "note", "description", "desc", "details"],
  done: ["done", "completed", "complete", "completed at", "completed on", "archived"],
} as const;

type Column = keyof typeof COLUMNS;

const STATUS_WORDS: [RegExp, Status][] = [
  [/^(done|complete|completed|closed|finished|resolved|shipped)$/i, "done"],
  [/^(in progress|doing|wip|started|active|in review|review)$/i, "wip"],
  [/^(on hold|hold|blocked|waiting|paused)$/i, "hold"],
];

const PRIORITY_WORDS: [RegExp, Priority][] = [
  [/^(urgent|critical|highest|p0|p1)$/i, "urgent"],
  [/^(high|p2)$/i, "high"],
  [/^(medium|med|normal|p3)$/i, "medium"],
  [/^(low|lowest|p4|p5)$/i, "low"],
];

const truthy = (value: string) => /^(yes|y|true|1|x|done|✓|✔)$/i.test(value.trim());

/** Reads dates as YYYY-MM-DD, or D/M/Y and M/D/Y decided once for the whole file. */
function dateReader(samples: string[]) {
  const slashed = samples.map((value) => value.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)).filter(Boolean);
  const monthFirst =
    slashed.some((match) => Number(match![2]) > 12) && !slashed.some((match) => Number(match![1]) > 12);
  return (raw: string | undefined): string | null => {
    const value = raw?.trim();
    if (!value) return null;
    const iso = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    const slash = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
    let parts: [number, number, number] | null = null;
    if (iso) parts = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
    else if (slash) {
      const year = Number(slash[3]) < 100 ? 2000 + Number(slash[3]) : Number(slash[3]);
      const [first, second] = [Number(slash[1]), Number(slash[2])];
      parts = monthFirst ? [year, first, second] : [year, second, first];
    }
    if (parts) {
      const [year, month, day] = parts;
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
      return date.toISOString().slice(0, 10);
    }
    return localDay(value);
  };
}

export function parseCsv(text: string, fileName = ""): ImportResult {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one task.");
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const index = {} as Record<Column, number>;
  for (const column of Object.keys(COLUMNS) as Column[]) {
    index[column] = header.findIndex((cell) => (COLUMNS[column] as readonly string[]).includes(cell));
  }
  if (index.name < 0) {
    throw new Error(`Add a column named "Task" (or Name or Title) for the task names. Found: ${rows[0].join(", ")}.`);
  }
  const body = rows.slice(1);
  const cell = (row: string[], column: Column) => (index[column] >= 0 ? (row[index[column]] ?? "").trim() : "");
  const readDate = dateReader(body.flatMap((row) => [cell(row, "deadline"), cell(row, "startDate")]));
  const warnings: string[] = [];
  const board: ImportedBoard = {
    name: fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Imported board",
    cards: [],
    done: [],
  };
  let skipped = 0;
  let badDates = 0;
  for (const row of body) {
    const name = clip(cell(row, "name"), 140);
    if (!name) {
      skipped += 1;
      continue;
    }
    const statusText = cell(row, "status");
    const doneText = cell(row, "done");
    const doneColumn = header[index.done] ?? "";
    const isDone = doneColumn.endsWith(" at") || doneColumn.endsWith(" on") ? Boolean(doneText) : truthy(doneText);
    let status: Status = STATUS_WORDS.find(([pattern]) => pattern.test(statusText))?.[1] ?? "open";
    if (isDone) status = "done";
    const rawDates = [cell(row, "deadline"), cell(row, "startDate")];
    const [deadline, startDate] = rawDates.map(readDate);
    badDates += rawDates.filter((value, position) => value && !(position ? startDate : deadline)).length;
    const task: ImportedTask = {
      name,
      status,
      holdReason: status === "hold" ? HOLD_REASON : null,
      startDate,
      deadline,
      priority: PRIORITY_WORDS.find(([pattern]) => pattern.test(cell(row, "priority")))?.[1] ?? null,
      labels: cleanLabels(cell(row, "labels").split(/[,;|]/)),
      checklist: [],
      notes: clipNotes(cell(row, "notes")),
    };
    const cardName = cell(row, "card");
    if (status === "done" && (!cardName || DONE_LIST.test(cardName))) {
      board.done.push(task);
      continue;
    }
    if (DONE_LIST.test(cardName)) {
      board.done.push({ ...task, status: "done", holdReason: null });
      continue;
    }
    const key = cardName || "Tasks";
    let card = board.cards.find((item) => item.name.toLowerCase() === key.toLowerCase());
    if (!card) {
      card = { name: key, tasks: [] };
      board.cards.push(card);
    }
    card.tasks.push(task);
  }
  if (skipped) warnings.push(`${skipped} row${skipped === 1 ? "" : "s"} without a task name ${skipped === 1 ? "was" : "were"} skipped.`);
  if (badDates) warnings.push(`${badDates} date${badDates === 1 ? "" : "s"} could not be read and ${badDates === 1 ? "was" : "were"} left empty.`);
  if (!board.cards.length && !board.done.length) throw new Error("No tasks were found in the CSV.");
  return { board: finish(board, warnings), source: "CSV", warnings };
}

export function parseImportFile(fileName: string, text: string): ImportResult {
  const trimmed = text.trimStart();
  if (fileName.toLowerCase().endsWith(".json") || trimmed.startsWith("{")) {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("That JSON file could not be read.");
    }
    return parseTrelloExport(data);
  }
  return parseCsv(text, fileName);
}

export function importCounts(board: ImportedBoard) {
  const open = board.cards.reduce((sum, card) => sum + card.tasks.length, 0);
  return { cards: board.cards.length, tasks: open + board.done.length, done: board.done.length };
}
