import { describe, expect, it } from "vitest";
import { assertChecklist, assertLabels } from "./domain";
import { EMPTY_FILTER, MY_TASKS, NO_OWNER, boardLabels, labelColor, matchesFilter, myTasks } from "./task-filters";
import { OWNER_ASSIGNEE, type Board, type BoardPayload, type Card, type Dependency } from "./types";

const TODAY = "2026-10-12";
let counter = 0;

function task(overrides: Partial<Dependency>): Dependency {
  counter += 1;
  return {
    id: `t${counter}`,
    ownerId: "owner",
    cardId: "c1",
    linkId: `l${counter}`,
    name: `Task ${counter}`,
    startDate: null,
    deadline: null,
    dependantOnId: null,
    dependantOnLabel: null,
    status: "open",
    holdReason: null,
    taskOwner: null,
    assigneeMemberId: null,
    doneFromCardId: null,
    priority: null,
    waitingFor: null,
    blocks: null,
    nextAction: null,
    notes: null,
    labels: [],
    checklist: [],
    assignedByUid: "owner",
    assignedByName: "Owner",
    originCardName: "Card",
    deliveredTo: [],
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("labels and checklists", () => {
  it("trims, de-duplicates and limits labels", () => {
    expect(assertLabels([" Bug ", "bug", "Client  work", ""])).toEqual(["Bug", "Client work"]);
    expect(assertLabels(undefined)).toEqual([]);
    expect(() => assertLabels(["x".repeat(25)])).toThrow(/24 characters/);
    expect(() => assertLabels(["a", "b", "c", "d", "e", "f", "g"])).toThrow(/up to 6/);
    expect(() => assertLabels("Bug")).toThrow(/list/);
  });

  it("keeps checklist ids, drops empty items and fills missing ids", () => {
    const items = assertChecklist([
      { id: "a1", text: " Draft ", done: true },
      { text: "Review" },
      { id: "bad id!", text: "Ship", done: "yes" },
      { id: "a1", text: "Duplicate id" },
      { text: "   " },
    ]);
    expect(items.map((item) => [item.text, item.done])).toEqual([
      ["Draft", true],
      ["Review", false],
      ["Ship", false],
      ["Duplicate id", false],
    ]);
    expect(items[0].id).toBe("a1");
    expect(new Set(items.map((item) => item.id)).size).toBe(4);
  });

  it("colours a label the same way every time, whatever the case", () => {
    expect(labelColor("Bug")).toBe(labelColor("bug"));
    expect(labelColor("Bug")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("search and filters", () => {
  const mine = (item: Dependency) => item.assigneeMemberId === "m-me";

  it("searches the name, notes, labels and checklist", () => {
    const item = task({ name: "Launch page", notes: "Ask legal", labels: ["Marketing"], checklist: [{ id: "1", text: "Hero image", done: false }] });
    for (const query of ["launch", "LEGAL", "market", "hero"]) {
      expect(matchesFilter(item, { ...EMPTY_FILTER, query }, mine, TODAY)).toBe(true);
    }
    expect(matchesFilter(item, { ...EMPTY_FILTER, query: "invoice" }, mine, TODAY)).toBe(false);
  });

  it("combines owner, priority, status, label and overdue", () => {
    const overdue = task({ deadline: "2026-10-01", priority: "high", labels: ["Bug"], assigneeMemberId: "m-me" });
    const later = task({ deadline: "2026-11-01", status: "wip" });
    expect(matchesFilter(overdue, { ...EMPTY_FILTER, overdue: true }, mine, TODAY)).toBe(true);
    expect(matchesFilter(later, { ...EMPTY_FILTER, overdue: true }, mine, TODAY)).toBe(false);
    expect(matchesFilter(overdue, { ...EMPTY_FILTER, owner: MY_TASKS }, mine, TODAY)).toBe(true);
    expect(matchesFilter(later, { ...EMPTY_FILTER, owner: NO_OWNER }, mine, TODAY)).toBe(true);
    expect(matchesFilter(overdue, { ...EMPTY_FILTER, owner: NO_OWNER }, mine, TODAY)).toBe(false);
    expect(matchesFilter(overdue, { ...EMPTY_FILTER, label: "bug", priority: "high" }, mine, TODAY)).toBe(true);
    expect(matchesFilter(later, { ...EMPTY_FILTER, status: "wip" }, mine, TODAY)).toBe(true);
    expect(matchesFilter(later, { ...EMPTY_FILTER, status: "hold" }, mine, TODAY)).toBe(false);
  });

  it("lists each label on a board once", () => {
    expect(boardLabels([task({ labels: ["Bug", "UI"] }), task({ labels: ["bug", "API"] })])).toEqual(["API", "Bug", "UI"]);
  });
});

describe("my tasks", () => {
  it("collects my open tasks across boards, grouped by due date", () => {
    const board = (id: string, ownerId: string, members: Board["members"] = []): Board => ({
      id,
      ownerId,
      name: id,
      color: "#4c7dff",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      members,
    });
    const card = (id: string, boardId: string, isDone = false): Card => ({
      id,
      ownerId: "x",
      boardId,
      name: id,
      color: "#4c7dff",
      isSelf: false,
      isDone,
      assigneeEmail: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const payload = {
      user: { uid: "me", email: "me@example.com", name: "Me", photoURL: null, createdAt: "" },
      boards: [
        board("Mine", "me"),
        board("Shared", "boss", [{ id: "m1", name: "Me", email: "me@example.com", uid: "me", addedAt: "", joinedAt: "" }]),
      ],
      cards: [card("a", "Mine"), card("b", "Shared"), card("done", "Mine", true)],
      dependencies: [
        task({ cardId: "a", name: "Unassigned on my board", deadline: TODAY }),
        task({ cardId: "a", name: "Mine overdue", deadline: "2026-10-05", assigneeMemberId: OWNER_ASSIGNEE }),
        task({ cardId: "a", name: "Someone else's", assigneeMemberId: "other" }),
        task({ cardId: "b", name: "Assigned on shared", deadline: "2026-10-15", assigneeMemberId: "m1" }),
        task({ cardId: "b", name: "Unassigned on shared" }),
        task({ cardId: "a", name: "Finished", status: "done", assigneeMemberId: OWNER_ASSIGNEE }),
        task({ cardId: "a", name: "No date", assigneeMemberId: OWNER_ASSIGNEE }),
      ],
      notifications: [],
    } as unknown as BoardPayload;
    const groups = myTasks(payload, TODAY);
    expect(groups.map((group) => [group.key, group.items.map((item) => item.task.name)])).toEqual([
      ["overdue", ["Mine overdue"]],
      ["today", ["Unassigned on my board"]],
      ["week", ["Assigned on shared"]],
      ["undated", ["No date"]],
    ]);
  });
});
