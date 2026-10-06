import { describe, expect, it } from "vitest";
import {
  UNASSIGNED,
  overviewSentence,
  shortDate,
  summarizeMembers,
  summaryText,
  taskDates,
  type SummaryPerson,
} from "./member-summary";
import { OWNER_ASSIGNEE, type Dependency } from "./types";

const TODAY = "2026-10-06";

let counter = 0;
function task(overrides: Partial<Dependency>): Dependency {
  counter += 1;
  return {
    id: `t${counter}`,
    ownerId: "u1",
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
    assignedByUid: "u1",
    assignedByName: "Owner",
    originCardName: "Card",
    deliveredTo: [],
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

const people: SummaryPerson[] = [
  { id: OWNER_ASSIGNEE, name: "Mohammed", detail: "Board owner", isYou: true },
  { id: "m1", name: "Sumit", detail: "sumit@example.com" },
  { id: "m2", name: "Asha", detail: "asha@example.com" },
];

describe("summarizeMembers", () => {
  it("groups tasks by member, typed owner, then unassigned", () => {
    const summaries = summarizeMembers(
      people,
      [
        task({ assigneeMemberId: "m1" }),
        task({ taskOwner: "Design team" }),
        task({ taskOwner: "design team " }),
        task({}),
        task({ assigneeMemberId: "gone-member" }),
      ],
      TODAY,
    );
    expect(summaries.map((summary) => [summary.key, summary.tasks.length])).toEqual([
      [OWNER_ASSIGNEE, 0],
      ["m1", 1],
      ["m2", 0],
      ["typed:design team", 2],
      [UNASSIGNED, 2],
    ]);
    expect(summaries[3].name).toBe("Design team");
  });

  it("writes a full summary for one member", () => {
    const [, sumit] = summarizeMembers(
      people,
      [
        task({ assigneeMemberId: "m1", name: "API", status: "wip", startDate: "2026-10-03", deadline: "2026-10-08" }),
        task({ assigneeMemberId: "m1", name: "Login page", deadline: "2026-10-02" }),
        task({ assigneeMemberId: "m1", name: "Reports", deadline: "2026-10-10" }),
        task({ assigneeMemberId: "m1", name: "Billing", startDate: "2026-10-12", deadline: "2026-10-20" }),
        task({ assigneeMemberId: "m1", name: "Vendor", status: "hold", holdReason: "waiting on contract" }),
        task({ assigneeMemberId: "m1", name: "Setup", status: "done", deadline: "2026-09-30" }),
      ],
      TODAY,
    );
    expect(sumit.overdue).toBe(1);
    expect(sumit.sentences).toEqual([
      "Sumit has 6 tasks: 1 in progress, 3 open, 1 on hold and 1 done.",
      "Their open work runs from Oct 2 to Oct 20.",
      "Overdue: Login page (was due Oct 2).",
      "Working on now: API (Oct 3 – Oct 8).",
      "Due this week: Reports (Oct 10).",
      "Next up: Billing, starting Oct 12.",
      "On hold: Vendor (waiting on contract).",
      "No dates yet: Vendor.",
      "1 task done.",
    ]);
  });

  it("speaks to the signed-in person and handles empty or finished lists", () => {
    const summaries = summarizeMembers(
      people,
      [
        task({ assigneeMemberId: OWNER_ASSIGNEE, name: "Plan", deadline: "2026-10-07" }),
        task({ assigneeMemberId: "m2", status: "done" }),
        task({ assigneeMemberId: "m2", status: "done" }),
      ],
      TODAY,
    );
    expect(summaries[0].sentences.slice(0, 2)).toEqual([
      "You have 1 task: 1 open.",
      "Your open work is all on Oct 7.",
    ]);
    expect(summaries[1].sentences).toEqual(["Sumit has no tasks on this board."]);
    expect(summaries[2].sentences).toEqual(["Asha finished all 2 tasks."]);
  });

  it("describes unassigned work", () => {
    const summaries = summarizeMembers([], [task({ name: "Docs", deadline: "2026-10-09" })], TODAY);
    expect(summaries[0].sentences).toEqual([
      "1 task is not assigned to anyone: 1 open.",
      "This open work is all on Oct 9.",
      "Due this week: Docs (Oct 9).",
    ]);
  });
});

describe("overview and copy text", () => {
  it("summarises the whole board", () => {
    const summaries = summarizeMembers(
      people,
      [
        task({ assigneeMemberId: "m1", name: "Late", deadline: "2026-10-01" }),
        task({ assigneeMemberId: "m2", status: "done" }),
        task({ name: "Loose" }),
      ],
      TODAY,
    );
    expect(overviewSentence(summaries)).toBe("3 tasks across 2 people, 2 still open, 1 overdue. 1 task has no owner.");
    const text = summaryText(summaries, "Launch", TODAY);
    expect(text.startsWith("Launch · people summary · Oct 6")).toBe(true);
    expect(text).toContain("Mohammed (you)");
    expect(text).toContain("- Late · Open · due Oct 1 · overdue");
  });

  it("formats dates", () => {
    expect(shortDate("2026-10-08", TODAY)).toBe("Oct 8");
    expect(shortDate("2027-01-04", TODAY)).toBe("Jan 4, 2027");
    expect(taskDates({ startDate: "2026-10-03", deadline: "2026-10-08" }, TODAY)).toBe("Oct 3 – Oct 8");
    expect(taskDates({ startDate: "2026-10-03", deadline: null }, TODAY)).toBe("from Oct 3");
    expect(taskDates({ startDate: null, deadline: "2026-10-08" }, TODAY)).toBe("due Oct 8");
    expect(taskDates({ startDate: null, deadline: null }, TODAY)).toBeNull();
  });
});
