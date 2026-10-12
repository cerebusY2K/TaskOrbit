import { describe, expect, it } from "vitest";
import { IMPORT_MAX_TASKS, importCounts, parseCsv, parseCsvRows, parseImportFile, parseTrelloExport } from "./importers";

const trello = {
  name: "Website relaunch",
  lists: [
    { id: "l1", name: "To Do", closed: false, pos: 1 },
    { id: "l2", name: "Doing", closed: false, pos: 2 },
    { id: "l3", name: "Done", closed: false, pos: 3 },
    { id: "l4", name: "Old ideas", closed: true, pos: 4 },
  ],
  labels: [
    { id: "g", name: "", color: "green" },
    { id: "d", name: "Design", color: "purple" },
  ],
  cards: [
    {
      id: "c2",
      name: "Write copy",
      idList: "l1",
      pos: 2,
      desc: "Homepage and pricing",
      due: "2026-11-02T12:00:00.000Z",
      start: "2026-10-28T12:00:00.000Z",
      idLabels: ["d", "g"],
    },
    { id: "c1", name: "Pick fonts", idList: "l1", pos: 1, idLabels: [] },
    { id: "c3", name: "Build header", idList: "l2", pos: 1, dueComplete: true },
    { id: "c4", name: "Kickoff", idList: "l3", pos: 1 },
    { id: "c5", name: "Archived card", idList: "l1", pos: 3, closed: true },
    { id: "c6", name: "On a closed list", idList: "l4", pos: 1 },
  ],
  checklists: [
    {
      idCard: "c2",
      pos: 1,
      checkItems: [
        { name: "Pricing", state: "incomplete", pos: 2 },
        { name: "Hero", state: "complete", pos: 1 },
      ],
    },
  ],
};

describe("Trello import", () => {
  it("turns lists into cards and cards into tasks", () => {
    const { board, source, warnings } = parseTrelloExport(trello);
    expect(source).toBe("Trello");
    expect(board.name).toBe("Website relaunch");
    expect(board.cards.map((card) => card.name)).toEqual(["To Do", "Doing"]);
    expect(board.cards[0].tasks.map((task) => task.name)).toEqual(["Pick fonts", "Write copy"]);
    expect(board.cards[0].tasks[1]).toMatchObject({
      status: "open",
      startDate: "2026-10-28",
      deadline: "2026-11-02",
      labels: ["Design", "Green"],
      notes: "Homepage and pricing",
      checklist: [
        { text: "Hero", done: true },
        { text: "Pricing", done: false },
      ],
    });
    expect(board.cards[1].tasks).toHaveLength(0);
    expect(board.done.map((task) => [task.name, task.status])).toEqual([
      ["Build header", "done"],
      ["Kickoff", "done"],
    ]);
    expect(warnings).toEqual(["2 archived cards were skipped."]);
    expect(importCounts(board)).toEqual({ cards: 2, tasks: 4, done: 2 });
  });

  it("rejects JSON that is not a Trello export", () => {
    expect(() => parseTrelloExport({ tasks: [] })).toThrow(/Trello board export/);
    expect(() => parseImportFile("board.json", "{not json")).toThrow(/could not be read/);
    expect(parseImportFile("board.json", JSON.stringify(trello)).source).toBe("Trello");
  });
});

describe("CSV import", () => {
  it("reads quoted fields, newlines and doubled quotes", () => {
    expect(parseCsvRows('a,b\r\n"x, y","say ""hi""\nthere"\n\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
    expect(parseCsvRows("\uFEFFTask;Status\nOne;Done")).toEqual([
      ["Task", "Status"],
      ["One", "Done"],
    ]);
  });

  it("reads an Asana export, with sections as cards and completed tasks done", () => {
    const csv = [
      "Task ID,Created At,Completed At,Last Modified,Name,Section/Column,Assignee,Start Date,Due Date,Tags,Notes",
      '1,2026-10-01,,2026-10-02,Draft plan,Planning,Ada,2026-10-05,2026-10-09,"Ops, Q4","Line one\nLine two"',
      "2,2026-10-01,2026-10-03,2026-10-03,Book venue,Planning,,,2026-10-03,,",
      "3,2026-10-01,,2026-10-02,Send invites,Outreach,,,,,",
      "4,2026-10-01,,2026-10-02,,Outreach,,,,,",
    ].join("\n");
    const { board, warnings } = parseCsv(csv, "team_offsite.csv");
    expect(board.name).toBe("team offsite");
    expect(board.cards.map((card) => [card.name, card.tasks.map((task) => task.name)])).toEqual([
      ["Planning", ["Draft plan", "Book venue"]],
      ["Outreach", ["Send invites"]],
    ]);
    expect(board.cards[0].tasks[0]).toMatchObject({
      status: "open",
      startDate: "2026-10-05",
      deadline: "2026-10-09",
      labels: ["Ops", "Q4"],
      notes: "Line one\nLine two",
    });
    expect(board.cards[0].tasks[1].status).toBe("done");
    expect(warnings).toEqual(["1 row without a task name was skipped."]);
  });

  it("works out day-first or month-first dates for the whole file and maps status words", () => {
    const dayFirst = parseCsv("Task,Due,Status,Priority\nA,25/12/2026,In progress,P1\nB,03/04/2026,Blocked,low\nC,31/02/2026,,");
    const tasks = dayFirst.board.cards[0].tasks;
    expect(tasks.map((task) => task.deadline)).toEqual(["2026-12-25", "2026-04-03", null]);
    expect(tasks.map((task) => task.status)).toEqual(["wip", "hold", "open"]);
    expect(tasks[1].holdReason).toBeTruthy();
    expect(tasks.map((task) => task.priority)).toEqual(["urgent", "low", null]);
    expect(dayFirst.warnings).toContain("1 date could not be read and was left empty.");

    const monthFirst = parseCsv("Task,Due\nA,12/25/2026\nB,03/04/2026");
    expect(monthFirst.board.cards[0].tasks.map((task) => task.deadline)).toEqual(["2026-12-25", "2026-03-04"]);
  });

  it("puts rows from a Done list on the Done card and caps the task count", () => {
    const rows = Array.from({ length: IMPORT_MAX_TASKS + 5 }, (_, index) => `Task ${index},${index < 2 ? "Done" : "Backlog"}`);
    const { board, warnings } = parseCsv(`Name,List\n${rows.join("\n")}`);
    expect(board.done.map((task) => task.name)).toEqual([]);
    expect(importCounts(board).tasks).toBe(IMPORT_MAX_TASKS);
    expect(warnings).toContain(`Only the first ${IMPORT_MAX_TASKS} tasks are imported. 5 were left out.`);
    const small = parseCsv("Name,List\nShip it,Done\nPlan,Backlog");
    expect(small.board.done).toEqual([expect.objectContaining({ name: "Ship it", status: "done" })]);
  });

  it("explains what is missing", () => {
    expect(() => parseCsv("Title only")).toThrow(/header row and at least one task/);
    expect(() => parseCsv("Owner,Due\nAda,2026-10-01")).toThrow(/column named "Task"/);
  });
});
