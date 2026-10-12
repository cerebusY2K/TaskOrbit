import { describe, expect, it } from "vitest";
import { BoardService, DEFAULT_BOARDS } from "./board-service";
import { isOverdue } from "./domain";
import { MemoryStore } from "./store";
import { boardTemplate, templateTaskCount } from "./templates";
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
    expect(samBoard.cards.filter((item) => !item.isDone).map((item) => item.name)).toEqual(["Me"]);
    expect(samBoard.dependencies).toHaveLength(0);
  });

  it("gives every board a Done card that done tasks move into and out of", async () => {
    const { service } = setup();
    await service.signIn(ada);
    const first = await service.board(ada);
    for (const board of first.boards) {
      expect(first.cards.filter((card) => card.boardId === board.id && card.isDone)).toHaveLength(1);
    }
    const launch = await service.createBoard(ada, { name: "Launch" });
    const card = await service.createCard(ada, { name: "API", boardId: launch.id });
    const done = (await service.board(ada)).cards.find((item) => item.boardId === launch.id && item.isDone)!;
    expect(done.name).toBe("Done");
    await expect(service.deleteCard(ada, done.id)).rejects.toThrow(/Done card/);

    const task = await service.createDependency(ada, { cardId: card.id, name: "Ship", status: "wip" });
    const finished = await service.updateDependency(ada, task.dependency.id, { status: "done" });
    expect(finished.cardId).toBe(done.id);
    expect(finished.doneFromCardId).toBe(card.id);
    const reopened = await service.updateDependency(ada, task.dependency.id, { status: "open" });
    expect(reopened.cardId).toBe(card.id);
    expect(reopened.doneFromCardId).toBeNull();

    const dropped = await service.moveDependency(ada, task.dependency.id, done.id);
    expect(dropped.status).toBe("done");
    const pulled = await service.moveDependency(ada, task.dependency.id, card.id);
    expect(pulled.status).toBe("open");

    const createdDone = await service.createDependency(ada, { cardId: card.id, name: "Already done", status: "done" });
    const stored = (await service.board(ada)).dependencies.find((item) => item.id === createdDone.dependency.id)!;
    expect(stored.cardId).toBe(done.id);
  });

  it("pushes notifications to registered devices and drops expired ones", async () => {
    const store = new MemoryStore();
    const sent: { ids: string[]; title: string }[] = [];
    let expire = false;
    const pusher = {
      publicKey: "test-key",
      async send(devices: { id: string }[], message: { title: string }) {
        sent.push({ ids: devices.map((device) => device.id), title: message.title });
        return expire ? devices.map((device) => device.id) : [];
      },
    };
    const service = new BoardService(store, "https://depend.example", pusher);
    await service.signIn(ada);
    await service.signIn(sam);
    expect(service.pushPublicKey()).toBe("test-key");
    await expect(service.registerPush(sam, { kind: "web", subscription: { endpoint: "http://x" } })).rejects.toThrow();
    await service.registerPush(sam, {
      kind: "web",
      subscription: { endpoint: "https://push.example/abc", keys: { p256dh: "p", auth: "a" } },
    });
    const work = (await service.board(ada)).boards[0]!;
    const member = await service.addMember(ada, work.id, { name: "Sam", email: "sam@example.com" });
    const { url } = await service.boardInvite(ada, work.id);
    await service.acceptInvite(sam, url.split("/").pop()!);
    const me = (await service.board(ada)).cards.find((card) => card.isSelf)!;
    sent.length = 0;
    expire = true;
    await service.createDependency(ada, { cardId: me.id, name: "Push me", status: "open", assigneeMemberId: member.id });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(sent.map((item) => item.title)).toEqual(["New task for you"]);
    expect(await store.listPushDevices("sam")).toHaveLength(0);
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
    expect(adaBoard.cards.filter((item) => !item.isDone).map((item) => item.name)).toEqual(["Me", "Sam"]);
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

  it("saves labels and a checklist on a task and keeps them when other fields change", async () => {
    const { service } = setup();
    await service.signIn(ada);
    const card = await service.createCard(ada, { name: "Launch" });
    const { dependency } = await service.createDependency(ada, {
      cardId: card.id,
      name: "Press kit",
      labels: ["Marketing", "marketing", "Urgent"],
      checklist: [{ text: "Logo files" }, { text: "Screenshots", done: true }],
    });
    expect(dependency.labels).toEqual(["Marketing", "Urgent"]);
    expect(dependency.checklist.map((item) => [item.text, item.done])).toEqual([
      ["Logo files", false],
      ["Screenshots", true],
    ]);
    const renamed = await service.updateDependency(ada, dependency.id, { name: "Press kit v2" });
    expect(renamed.labels).toEqual(["Marketing", "Urgent"]);
    expect(renamed.checklist).toHaveLength(2);
    const ticked = await service.updateDependency(ada, dependency.id, {
      checklist: dependency.checklist.map((item) => ({ ...item, done: true })),
      labels: [],
    });
    expect(ticked.checklist.every((item) => item.done)).toBe(true);
    expect(ticked.checklist[0].id).toBe(dependency.checklist[0].id);
    expect(ticked.labels).toEqual([]);
    await expect(service.updateDependency(ada, dependency.id, { labels: "Bug" })).rejects.toThrow(/list/);
  });

  it("creates a board from a template with dates counted from the start day", async () => {
    const { service } = setup();
    await service.signIn(ada);
    const template = boardTemplate("product-launch")!;
    const board = await service.createBoardFromTemplate(ada, template.slug, "2026-10-30");
    expect(board.name).toBe(template.name);
    const loaded = await service.board(ada);
    const cards = loaded.cards.filter((card) => card.boardId === board.id);
    expect(cards.map((card) => card.name).sort()).toEqual([...template.cards.map((card) => card.name), "Done"].sort());
    const tasks = loaded.dependencies.filter((task) => cards.some((card) => card.id === task.cardId));
    expect(tasks).toHaveLength(templateTaskCount(template));
    const deploy = tasks.find((task) => task.name === "Deploy to production")!;
    expect(deploy.startDate).toBe("2026-11-19");
    expect(deploy.deadline).toBe("2026-11-19");
    expect(deploy.priority).toBe("urgent");
    expect(tasks.find((task) => task.id === deploy.dependantOnId)?.name).toBe("QA pass on staging");
    expect(tasks.find((task) => task.name === "Launch email")?.waitingFor).toBe("Release notes from Product");
    await expect(service.createBoardFromTemplate(ada, "nope")).rejects.toThrow(/not found/);
    await expect(service.createBoardFromTemplate(ada, template.slug, "30/10/2026")).rejects.toThrow();
    await expect(service.createBoardFromTemplate(sam, template.slug)).rejects.toThrow(/Sign in/);
  });

  it("creates the default boards once, even when sign-in and load race", async () => {
    const { service } = setup();
    await Promise.all([service.signIn(ada), service.board(ada).catch(() => null)]);
    await service.signIn(ada);
    const loaded = await service.board(ada);
    expect(loaded.boards).toHaveLength(DEFAULT_BOARDS.length);
  });
});

describe("comments, activity and reminders", () => {
  const lee: SessionUser = { uid: "lee", email: "lee@example.com", name: "Lee", photoURL: null };

  async function sharedBoard() {
    const { service, store } = setup();
    await service.signIn(ada);
    await service.signIn(sam);
    await service.signIn(lee);
    const work = (await service.board(ada)).boards[0]!;
    const samMember = await service.addMember(ada, work.id, { name: "Sam", email: "sam@example.com" });
    await service.acceptInvite(sam, (await service.boardInvite(ada, work.id)).token);
    const me = (await service.board(ada)).cards.find((card) => card.isSelf && card.boardId === work.id)!;
    return { service, store, work, me, samMember };
  }

  const titles = async (service: BoardService, user: SessionUser) =>
    (await service.board(user)).notifications.map((item) => item.title);

  it("notifies the people on a task when someone comments", async () => {
    const { service, me, samMember } = await sharedBoard();
    const { dependency } = await service.createDependency(ada, {
      cardId: me.id,
      name: "Ship",
      status: "open",
      assigneeMemberId: samMember.id,
    });

    await service.addComment(sam, dependency.id, "  Started on this  ");
    expect(await titles(service, ada)).toContain('Sam commented on "Ship"');
    expect(await titles(service, sam)).not.toContain('Sam commented on "Ship"');

    await service.addComment(ada, dependency.id, "Thanks");
    expect(await titles(service, sam)).toContain('Ada commented on "Ship"');

    const thread = await service.taskThread(sam, dependency.id);
    expect(thread.comments.map((item) => item.body)).toEqual(["Started on this", "Thanks"]);
    expect(thread.activity[0]?.text).toBe('commented on "Ship"');
    expect((await service.board(ada)).dependencies.find((item) => item.id === dependency.id)?.commentCount).toBe(2);

    await expect(service.addComment(ada, dependency.id, "   ")).rejects.toThrow(/Comment/);
    await expect(service.addComment(lee, dependency.id, "Hi")).rejects.toThrow(/not found/i);
    await expect(service.taskThread(lee, dependency.id)).rejects.toThrow(/not found/i);
  });

  it("lets only the author or the board owner delete a comment", async () => {
    const { service, me } = await sharedBoard();
    const { dependency } = await service.createDependency(ada, { cardId: me.id, name: "Ship", status: "open" });
    const fromAda = await service.addComment(ada, dependency.id, "Owner note");
    const fromSam = await service.addComment(sam, dependency.id, "Member note");

    await expect(service.deleteComment(sam, fromAda.id)).rejects.toThrow(/author or the board owner/);
    await service.deleteComment(sam, fromSam.id);
    await service.addComment(sam, dependency.id, "Again");
    const again = (await service.taskThread(ada, dependency.id)).comments.find((item) => item.body === "Again")!;
    await service.deleteComment(ada, again.id);

    const thread = await service.taskThread(ada, dependency.id);
    expect(thread.comments.map((item) => item.body)).toEqual(["Owner note"]);
    expect((await service.board(ada)).dependencies.find((item) => item.id === dependency.id)?.commentCount).toBe(1);
    await expect(service.deleteComment(ada, "missing")).rejects.toThrow(/not found/);
  });

  it("logs task changes to the board activity, newest first", async () => {
    const { service, store, work, me, samMember } = await sharedBoard();
    const { dependency } = await service.createDependency(ada, { cardId: me.id, name: "Ship", status: "open" });
    await service.updateDependency(ada, dependency.id, {
      name: "Ship v2",
      status: "wip",
      deadline: "2026-11-03",
      assigneeMemberId: samMember.id,
    });
    await service.deleteDependency(ada, dependency.id);

    const activity = await service.boardActivity(sam, work.id);
    const texts = activity.map((entry) => entry.text);
    expect(texts).toEqual([
      'deleted "Ship v2"',
      'set "Ship v2" due 3 Nov 2026',
      'assigned "Ship v2" to Sam',
      'marked "Ship v2" In Progress',
      'renamed "Ship" to "Ship v2"',
      'added "Ship" to Me',
      "joined the board",
    ]);
    expect(activity.find((entry) => entry.text === "joined the board")?.actorName).toBe("Sam");
    await expect(service.boardActivity(lee, work.id)).rejects.toThrow(/not found/i);

    await service.deleteBoard(ada, work.id);
    expect(await store.listActivityByBoard(work.id, 10)).toHaveLength(0);
  });

  it("sends each due-date reminder once, to the assignee or else the board owner", async () => {
    const { service, me, samMember } = await sharedBoard();
    const forSam = await service.createDependency(ada, {
      cardId: me.id,
      name: "Sam's deadline",
      status: "open",
      deadline: "2026-11-03",
      assigneeMemberId: samMember.id,
    });
    await service.createDependency(ada, { cardId: me.id, name: "Ada's deadline", status: "wip", deadline: "2026-11-02" });
    await service.createDependency(ada, { cardId: me.id, name: "Finished", status: "done", deadline: "2026-11-03" });
    await service.createDependency(ada, { cardId: me.id, name: "Later", status: "open", deadline: "2026-11-09" });

    expect(await service.sendReminders("2026-11-03")).toMatchObject({ sent: 2 });
    expect(await titles(service, sam)).toContain("Due today: Sam's deadline");
    expect(await titles(service, ada)).toContain("Overdue: Ada's deadline");
    expect((await titles(service, ada)).some((title) => title.includes("Finished") || title.includes("Later"))).toBe(false);

    expect(await service.sendReminders("2026-11-03")).toMatchObject({ sent: 0 });

    expect(await service.sendReminders("2026-11-04")).toMatchObject({ sent: 1 });
    expect(await titles(service, sam)).toContain("Overdue: Sam's deadline");
    expect((await service.board(ada)).dependencies.find((item) => item.id === forSam.dependency.id)?.remindedFor).toBe(
      "2026-11-03:overdue",
    );
    await expect(service.sendReminders("tomorrow")).rejects.toThrow();
  });
});
