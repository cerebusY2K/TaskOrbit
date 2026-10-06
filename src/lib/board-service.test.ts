import { describe, expect, it } from "vitest";
import { BoardService, DEFAULT_BOARDS } from "./board-service";
import { isOverdue } from "./domain";
import { MemoryStore } from "./store";
import type { SessionUser } from "./types";

const ada: SessionUser = {
  uid: "ada",
  email: "ada@example.com",
  name: "Ada",
  photoURL: null,
};

const sam: SessionUser = {
  uid: "sam",
  email: "sam@example.com",
  name: "Sam",
  photoURL: null,
};

function setup() {
  const store = new MemoryStore();
  const service = new BoardService(store, "https://depend.example");
  return { store, service };
}

describe("deadline urgency", () => {
  it("vibrates only after the deadline day has passed", () => {
    expect(isOverdue("2026-10-04", "open", "2026-10-05")).toBe(true);
    expect(isOverdue("2026-10-05", "wip", "2026-10-05")).toBe(false);
    expect(isOverdue("2026-10-04", "done", "2026-10-05")).toBe(false);
    expect(isOverdue(null, "open", "2026-10-05")).toBe(false);
  });
});

describe("board", () => {
  it("gives every person a Me card and does not duplicate it", async () => {
    const { service } = setup();
    await service.signIn(ada);
    await service.signIn(ada);
    const board = await service.board(ada);
    expect(board.cards.filter((card) => card.isSelf)).toHaveLength(1);
    expect(board.cards[0]?.name).toBe("Me");
  });

  it("keeps one person's cards invisible to another", async () => {
    const { service } = setup();
    await service.signIn(ada);
    await service.signIn(sam);
    const card = await service.createCard(ada, { name: "Vendor", color: "#c4553a" });
    await expect(service.updateCard(sam, card.id, { name: "Stolen" })).rejects.toThrow(/not found/i);
    await expect(
      service.createDependency(sam, { cardId: card.id, name: "Nope", status: "open" }),
    ).rejects.toThrow(/not found/i);
    const samBoard = await service.board(sam);
    expect(samBoard.cards.map((item) => item.name)).toEqual(["Me"]);
    expect(samBoard.dependencies).toHaveLength(0);
  });

  it("requires a reason on hold and keeps the other statuses", async () => {
    const { service } = setup();
    await service.signIn(ada);
    const card = await service.createCard(ada, { name: "Launch" });
    await expect(
      service.createDependency(ada, { cardId: card.id, name: "Copy", status: "hold" }),
    ).rejects.toThrow(/reason is required/i);
    const held = await service.createDependency(ada, {
      cardId: card.id,
      name: "Copy",
      status: "hold",
      holdReason: "Waiting on legal",
    });
    expect(held.dependency.holdReason).toBe("Waiting on legal");
    const cleared = await service.updateDependency(ada, held.dependency.id, { status: "wip" });
    expect(cleared.status).toBe("wip");
    expect(cleared.holdReason).toBeNull();
    await expect(
      service.createDependency(ada, { cardId: card.id, name: "Bad", status: "later" }),
    ).rejects.toThrow(/status/i);
  });

  it("stores an optional deadline and who it depends on", async () => {
    const { service } = setup();
    await service.signIn(ada);
    const card = await service.createCard(ada, { name: "Launch" });
    const first = await service.createDependency(ada, {
      cardId: card.id,
      name: "Brand",
      status: "open",
    });
    const second = await service.createDependency(ada, {
      cardId: card.id,
      name: "Site",
      status: "open",
      deadline: "2026-11-02",
      dependantOnId: first.dependency.id,
    });
    expect(second.dependency.deadline).toBe("2026-11-02");
    expect(second.dependency.dependantOnLabel).toBe("Brand");
    const outside = await service.createDependency(ada, {
      cardId: card.id,
      name: "Press",
      status: "open",
      dependantOnLabel: "Printer outside the team",
    });
    expect(outside.dependency.dependantOnId).toBeNull();
    expect(outside.dependency.dependantOnLabel).toBe("Printer outside the team");
    await expect(
      service.updateDependency(ada, first.dependency.id, { dependantOnId: second.dependency.id }),
    ).rejects.toThrow(/circular/i);
  });

  it("refuses to delete the Me card", async () => {
    const { service } = setup();
    await service.signIn(ada);
    const board = await service.board(ada);
    const self = board.cards.find((card) => card.isSelf)!;
    await expect(service.deleteCard(ada, self.id)).rejects.toThrow(/Me card/i);
  });

  it("keeps another person's board empty when you add work to your own card", async () => {
    const { service } = setup();
    await service.signIn(ada);
    await service.signIn(sam);
    const card = await service.createCard(ada, { name: "Sam", color: "#2c4f8f" });
    const created = await service.createDependency(ada, {
      cardId: card.id,
      name: "Send the contract",
      status: "open",
      deadline: "2026-10-01",
    });
    expect((await service.board(sam)).dependencies).toHaveLength(0);
    expect((await service.board(sam)).notifications).toHaveLength(0);
    const adaBoard = await service.board(ada);
    expect(adaBoard.dependencies.map((item) => item.name)).toEqual(["Send the contract"]);
    expect(adaBoard.dependencies[0]?.id).toBe(created.dependency.id);
    expect(adaBoard.cards.map((item) => item.name)).toEqual(["Me", "Sam"]);
  });

  it("reuses one invite link per board and joins it once", async () => {
    const { service } = setup();
    await service.signIn(ada);
    await service.signIn(sam);
    const work = (await service.board(ada)).boards[0]!;
    const first = await service.boardInvite(ada, work.id);
    const second = await service.boardInvite(ada, work.id);
    expect(first.url).toBe(second.url);
    expect(first.url.startsWith("https://depend.example/invite/")).toBe(true);
    await expect(service.boardInvite(sam, work.id)).rejects.toThrow(/not found/i);
    await expect(service.previewInvite("missing")).rejects.toThrow(/not valid/);
    expect(await service.previewInvite(first.token)).toEqual({ fromName: "Ada", boardName: work.name });
    expect((await service.acceptInvite(ada, first.token)).status).toBe("self");
    expect((await service.acceptInvite(sam, first.token)).status).toBe("accepted");
    expect((await service.acceptInvite(sam, first.token)).status).toBe("already");
    const samBoard = await service.board(sam);
    expect(samBoard.boards.find((item) => item.id === work.id)?.ownerName).toBe("Ada");
    expect(samBoard.notifications.map((item) => item.title)).toContain(`You joined ${work.name}`);
    expect((await service.board(ada)).notifications.map((item) => item.title)).toContain(`Sam joined ${work.name}`);
    await service.markAllNotificationsRead(sam);
    expect((await service.board(sam)).notifications.every((item) => item.read)).toBe(true);
  });

  it("merges a placeholder member into the account they joined with", async () => {
    const { service } = setup();
    const sumit: SessionUser = { uid: "sumit", email: "sumit@abc.com", name: "Sumit A", photoURL: null };
    await service.signIn(ada);
    const work = (await service.board(ada)).boards[0]!;
    const me = (await service.board(ada)).cards.find((card) => card.isSelf)!;
    const placeholder = await service.addMember(ada, work.id, { name: "Sumit", email: "Sumit@xyz.com" });
    expect(placeholder.email).toBe("sumit@xyz.com");
    await expect(service.addMember(ada, work.id, { name: "Again", email: "sumit@xyz.com" })).rejects.toThrow(
      /already a member/,
    );
    const assigned = await service.createDependency(ada, {
      cardId: me.id,
      name: "Ship the release notes",
      status: "open",
      assigneeMemberId: placeholder.id,
    });
    expect(assigned.dependency.taskOwner).toBe("Sumit");
    const unassigned = await service.createDependency(ada, { cardId: me.id, name: "Ada only", status: "open" });

    await service.signIn(sumit);
    const invite = await service.boardInvite(ada, work.id);
    await service.acceptInvite(sumit, invite.token);
    const joined = (await service.board(ada)).boards.find((item) => item.id === work.id)!.members!;
    expect(joined.map((member) => [member.email, Boolean(member.uid)])).toEqual([
      ["sumit@xyz.com", false],
      ["sumit@abc.com", true],
    ]);
    const account = joined.find((member) => member.uid === "sumit")!;

    const before = await service.board(sumit);
    expect(before.dependencies.map((item) => item.name).sort()).toEqual(["Ada only", "Ship the release notes"]);
    await expect(
      service.updateDependency(sumit, assigned.dependency.id, { status: "wip" }),
    ).rejects.toThrow(/owner, the task's creator, or its assignee/);

    const merged = await service.mergeMember(ada, work.id, { fromId: placeholder.id, intoId: account.id });
    expect(merged.moved).toBe(1);
    const after = (await service.board(ada)).boards.find((item) => item.id === work.id)!;
    expect(after.members!.map((member) => member.email)).toEqual(["sumit@abc.com"]);
    const task = (await service.board(sumit)).dependencies.find((item) => item.id === assigned.dependency.id)!;
    expect(task.assigneeMemberId).toBe(account.id);
    expect(task.taskOwner).toBe("Sumit A");
    expect((await service.board(sumit)).notifications.map((item) => item.title)).toContain("1 task moved to you");

    await expect(service.updateDependency(sumit, assigned.dependency.id, { status: "wip" })).resolves.toMatchObject({
      status: "wip",
    });
    await expect(service.deleteDependency(sumit, assigned.dependency.id)).rejects.toThrow(/not found/i);
    await expect(service.updateDependency(sumit, unassigned.dependency.id, { status: "done" })).rejects.toThrow(
      /owner, the task's creator, or its assignee/,
    );
    await expect(service.updateCard(sumit, me.id, { name: "Mine" })).rejects.toThrow(/not found/i);
    await expect(service.addMember(sumit, work.id, { name: "X", email: "x@y.com" })).rejects.toThrow(/not found/i);

    const own = await service.createDependency(sumit, { cardId: me.id, name: "Sumit's idea", status: "open" });
    expect(own.dependency.ownerId).toBe("ada");
    await expect(service.updateDependency(sumit, own.dependency.id, { name: "Sumit's plan" })).resolves.toMatchObject({
      name: "Sumit's plan",
    });
    expect((await service.board(ada)).dependencies.some((item) => item.id === own.dependency.id)).toBe(true);
    await service.deleteDependency(sumit, own.dependency.id);
    expect((await service.board(ada)).dependencies.some((item) => item.id === own.dependency.id)).toBe(false);
  });

  it("links a joining account to the member with the same email, and lets them leave", async () => {
    const { service } = setup();
    await service.signIn(ada);
    await service.signIn(sam);
    const work = (await service.board(ada)).boards[0]!;
    const member = await service.addMember(ada, work.id, { name: "Samuel", email: "sam@example.com" });
    const me = (await service.board(ada)).cards.find((card) => card.isSelf)!;
    await service.acceptInvite(sam, (await service.boardInvite(ada, work.id)).token);
    const members = (await service.board(ada)).boards.find((item) => item.id === work.id)!.members!;
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ id: member.id, uid: "sam", name: "Samuel" });

    await service.createDependency(ada, { cardId: me.id, name: "For Sam", status: "open", assigneeMemberId: member.id });
    expect((await service.board(sam)).notifications.map((item) => item.title)).toContain("New task for you");

    await service.leaveBoard(sam, work.id);
    expect((await service.board(sam)).boards.some((item) => item.id === work.id)).toBe(false);
    expect((await service.board(sam)).dependencies).toHaveLength(0);
    const left = (await service.board(ada)).boards.find((item) => item.id === work.id)!.members!;
    expect(left[0]).toMatchObject({ id: member.id, uid: null });

    await service.removeMember(ada, work.id, member.id);
    const task = (await service.board(ada)).dependencies.find((item) => item.name === "For Sam")!;
    expect(task.assigneeMemberId).toBeNull();
  });

  it("moves a dependency onto another card and keeps the parent as a note", async () => {
    const { service } = setup();
    await service.signIn(ada);
    const me = (await service.board(ada)).cards[0];
    const vendor = await service.createCard(ada, { name: "Vendor" });
    const parent = await service.createDependency(ada, {
      cardId: me.id,
      name: "Quote",
      status: "open",
    });
    const child = await service.createDependency(ada, {
      cardId: me.id,
      name: "Pay",
      status: "open",
      dependantOnId: parent.dependency.id,
    });
    const moved = await service.moveDependency(ada, child.dependency.id, vendor.id);
    expect(moved.cardId).toBe(vendor.id);
    expect(moved.dependantOnId).toBeNull();
    expect(moved.dependantOnLabel).toBe("Quote");
    const board = await service.board(ada);
    expect(board.dependencies.find((item) => item.id === parent.dependency.id)?.cardId).toBe(me.id);
  });

  it("does not copy a dragged dependency onto someone else's board", async () => {
    const { service } = setup();
    await service.signIn(ada);
    await service.signIn(sam);
    const me = (await service.board(ada)).cards[0];
    const samCard = await service.createCard(ada, { name: "Sam" });
    const created = await service.createDependency(ada, {
      cardId: me.id,
      name: "Send the file",
      status: "open",
    });
    await service.moveDependency(ada, created.dependency.id, samCard.id);
    expect((await service.board(ada)).dependencies[0]?.cardId).toBe(samCard.id);
    expect((await service.board(sam)).dependencies).toHaveLength(0);
    await expect(service.moveDependency(sam, created.dependency.id, me.id)).rejects.toThrow(/not found/i);
  });

  it("keeps cards on the board they were added to and stores task details", async () => {
    const { service } = setup();
    await service.signIn(ada);
    const defaults = (await service.board(ada)).boards;
    expect(defaults.map((item) => item.name)).toEqual(DEFAULT_BOARDS.map((item) => item.name));
    const first = defaults[0];
    expect(first?.color).toBe(DEFAULT_BOARDS[0].color);
    const second = await service.createBoard(ada, { name: "Launch", color: "#6554c0" });
    const card = await service.createCard(ada, { name: "API", boardId: second.id });
    const created = await service.createDependency(ada, {
      cardId: card.id,
      name: "Implement EKYC document upload",
      status: "wip",
      taskOwner: "Rahul",
      priority: "high",
      startDate: "2026-10-01",
      deadline: "2026-10-08",
      dependantOnLabel: "API changes",
      waitingFor: "Backend team",
      blocks: "QA testing",
      nextAction: "Backend needs to deploy API",
      notes: "iOS implementation pending",
    });
    expect(created.dependency.taskOwner).toBe("Rahul");
    expect(created.dependency.priority).toBe("high");
    expect(created.dependency.waitingFor).toBe("Backend team");
    expect(created.dependency.blocks).toBe("QA testing");
    expect(created.dependency.nextAction).toBe("Backend needs to deploy API");
    expect(created.dependency.startDate).toBe("2026-10-01");
    expect(created.dependency.deadline).toBe("2026-10-08");
    await expect(
      service.updateDependency(ada, created.dependency.id, { startDate: "2026-10-09" }),
    ).rejects.toThrow(/To date cannot be before the From date/);
    const before = created.dependency.updatedAt;
    await new Promise((resolve) => setTimeout(resolve, 5));
    const edited = await service.updateDependency(ada, created.dependency.id, { status: "done" });
    expect(edited.updatedAt > before).toBe(true);
    expect(created.dependency.notes).toBe("iOS implementation pending");
    const loaded = await service.board(ada);
    expect(loaded.cards.find((item) => item.name === "API")?.boardId).toBe(second.id);
    expect(loaded.cards.find((item) => item.isSelf)?.boardId).toBe(first?.id);
    for (const item of defaults) {
      await expect(service.deleteBoard(ada, item.id)).resolves.toBeUndefined();
    }
    expect((await service.board(ada)).cards.find((item) => item.isSelf)?.boardId).toBe(second.id);
    await expect(service.deleteBoard(ada, second.id)).rejects.toThrow(/at least one board/i);
  });

  it("creates the default boards once, even when sign-in and load race", async () => {
    const { service } = setup();
    await Promise.all([service.signIn(ada), service.board(ada).catch(() => null)]);
    await service.signIn(ada);
    const loaded = await service.board(ada);
    expect(loaded.boards).toHaveLength(DEFAULT_BOARDS.length);
  });
});
