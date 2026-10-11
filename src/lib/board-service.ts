import { createHash, randomBytes, randomUUID } from "crypto";
import {
  assertColor,
  assertDependencyDraft,
  assertEmail,
  assertName,
  defaultCardColor,
  normalizeEmail,
} from "./domain";
import { BoardError } from "./errors";
import type { Pusher } from "./push";
import type { Store } from "./store";
import type { Board, BoardMember, Card, Dependency, PushDevice, SessionUser, UserProfile } from "./types";
import { OWNER_ASSIGNEE } from "./types";

type Actor = SessionUser;

export const DEFAULT_BOARDS = [
  { name: "Work", color: "#4c7dff" },
  { name: "Personal", color: "#22b07d" },
  { name: "Projects", color: "#a970ff" },
  { name: "Follow-ups", color: "#ff9f43" },
  { name: "Ideas", color: "#ff5c8a" },
] as const;

export const DONE_CARD_COLOR = "#2f6b45";

function now() {
  return new Date().toISOString();
}

function id() {
  return randomUUID();
}

export class BoardService {
  constructor(
    private store: Store,
    private appUrl: string,
    private pusher: Pusher | null = null,
  ) {}

  pushPublicKey() {
    return this.pusher?.publicKey ?? null;
  }

  async registerPush(
    actor: Actor,
    input: { kind?: unknown; subscription?: unknown; token?: unknown; platform?: unknown },
  ) {
    let device: PushDevice;
    if (input.kind === "fcm") {
      if (typeof input.token !== "string" || input.token.length < 20 || input.token.length > 4096) {
        throw new BoardError("Missing push token.");
      }
      const platform = input.platform === "ios" || input.platform === "android" ? input.platform : "android";
      device = { id: deviceId(input.token), uid: actor.uid, kind: "fcm", endpoint: null, keys: null, token: input.token, platform, createdAt: now() };
    } else {
      const subscription = input.subscription as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
      const endpoint = subscription?.endpoint;
      const p256dh = subscription?.keys?.p256dh;
      const auth = subscription?.keys?.auth;
      if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || typeof p256dh !== "string" || typeof auth !== "string") {
        throw new BoardError("That push subscription is not valid.");
      }
      device = { id: deviceId(endpoint), uid: actor.uid, kind: "web", endpoint, keys: { p256dh, auth }, token: null, platform: "web", createdAt: now() };
    }
    await this.store.savePushDevice(device);
    return { id: device.id };
  }

  async unregisterPush(actor: Actor, input: { endpoint?: unknown; token?: unknown }) {
    const key = typeof input.token === "string" ? input.token : typeof input.endpoint === "string" ? input.endpoint : null;
    if (!key) return;
    const target = (await this.store.listPushDevices(actor.uid)).find((device) => device.id === deviceId(key));
    if (target) await this.store.deletePushDevice(target.id);
  }

  async signIn(input: SessionUser): Promise<UserProfile> {
    const email = assertEmail(input.email);
    const name = input.name?.trim() || email.split("@")[0];
    const timestamp = now();
    const user = await this.store.upsertUser({
      uid: input.uid,
      email,
      name,
      photoURL: input.photoURL,
      createdAt: timestamp,
    });
    await this.ensureWorkspace(user);
    return (await this.store.getUser(user.uid)) ?? user;
  }

  async board(actor: Actor) {
    const user = await this.store.getUser(actor.uid);
    if (!user) throw new BoardError("Sign in required.", 401);
    await this.ensureWorkspace(user);
    const boards = (await this.store.listBoards(actor.uid)).map((board) => fillBoard(board, user.name));
    const cards = await this.store.listCards(actor.uid);
    const dependencies = await this.store.listDependenciesByOwner(actor.uid);
    const shared = (await this.store.listSharedBoards(actor.uid)).filter((board) => board.ownerId !== actor.uid);
    for (const board of shared) {
      const owner = await this.store.getUser(board.ownerId);
      boards.push(fillBoard(board, owner?.name ?? "Board owner"));
      const boardCards = await this.store.listCardsByBoard(board.id);
      if (!boardCards.some((card) => card.isDone)) boardCards.push(await this.doneCard(board));
      cards.push(...boardCards);
      for (const card of boardCards) dependencies.push(...(await this.store.listDependenciesByCard(card.id)));
    }
    const notifications = await this.store.listNotifications(actor.uid);
    return { user, boards, cards, dependencies: dependencies.map(fillDependency), notifications };
  }

  async addMember(actor: Actor, boardId: string, input: { name?: unknown; email?: unknown }) {
    const board = await this.ownedBoard(actor, boardId);
    const name = assertName(input.name, "Member name");
    const email = assertEmail(input.email, "Member email");
    if (email === normalizeEmail(actor.email)) throw new BoardError("You already own this board.");
    const members = board.members ?? [];
    if (members.some((member) => member.email === email)) {
      throw new BoardError(`${email} is already a member of this board.`);
    }
    const member: BoardMember = { id: id(), name, email, uid: null, addedAt: now(), joinedAt: null };
    await this.saveMembers(board, [...members, member]);
    return member;
  }

  async removeMember(actor: Actor, boardId: string, memberId: string) {
    const board = await this.ownedBoard(actor, boardId);
    const members = board.members ?? [];
    if (!members.some((member) => member.id === memberId)) throw new BoardError("Member not found.", 404);
    for (const task of await this.boardTasks(board.id)) {
      if (task.assigneeMemberId === memberId) {
        await this.store.updateDependency(task.id, { assigneeMemberId: null, updatedAt: now() });
      }
    }
    await this.saveMembers(
      board,
      members.filter((member) => member.id !== memberId),
    );
  }

  async mergeMember(actor: Actor, boardId: string, input: { fromId?: unknown; intoId?: unknown }) {
    const board = await this.ownedBoard(actor, boardId);
    const members = board.members ?? [];
    const from = members.find((member) => member.id === input.fromId);
    const into = members.find((member) => member.id === input.intoId);
    if (!from || !into) throw new BoardError("Member not found.", 404);
    if (from.id === into.id) throw new BoardError("Pick two different members to merge.");
    let moved = 0;
    for (const task of await this.boardTasks(board.id)) {
      if (task.assigneeMemberId !== from.id) continue;
      await this.store.updateDependency(task.id, { assigneeMemberId: into.id, taskOwner: into.name, updatedAt: now() });
      moved += 1;
    }
    await this.saveMembers(
      board,
      members.filter((member) => member.id !== from.id),
    );
    if (into.uid && moved > 0) {
      await this.notify(
        into.uid,
        `${moved} task${moved === 1 ? "" : "s"} moved to you`,
        `${actor.name} moved ${from.name}'s tasks on ${board.name} to you.`,
      );
    }
    return { moved, member: into };
  }

  async boardInvite(actor: Actor, boardId: string, origin?: string) {
    const board = await this.ownedBoard(actor, boardId);
    const existing = await this.store.findInviteByBoard(board.id);
    const invite =
      existing ??
      (await this.store.createInvite({
        id: id(),
        token: inviteToken(),
        boardId: board.id,
        email: null,
        fromUid: actor.uid,
        fromName: actor.name,
        acceptedBy: [],
        createdAt: now(),
      }));
    return this.publicInvite(invite, origin);
  }

  async leaveBoard(actor: Actor, boardId: string) {
    const board = await this.store.getBoard(boardId);
    const members = board?.members ?? [];
    if (!board || !members.some((member) => member.uid === actor.uid)) throw new BoardError("Board not found.", 404);
    await this.saveMembers(
      board,
      members.map((member) => (member.uid === actor.uid ? { ...member, uid: null, joinedAt: null } : member)),
    );
    await this.notify(board.ownerId, `${actor.name} left ${board.name}`, `${actor.name} (${actor.email}) left the board.`);
  }

  async createBoard(actor: Actor, input: { name?: unknown; color?: unknown }) {
    const board: Board = {
      id: id(),
      ownerId: actor.uid,
      name: assertName(input.name, "Board name"),
      color: input.color == null || input.color === "" ? "#6554c0" : assertColor(input.color, "board color"),
      createdAt: now(),
      updatedAt: now(),
    };
    const created = await this.store.createBoard(board);
    await this.doneCard(created);
    return created;
  }

  async updateBoard(actor: Actor, boardId: string, input: { name?: unknown; color?: unknown }) {
    const board = await this.ownedBoard(actor, boardId);
    const patch: Partial<Board> = { updatedAt: now() };
    if (input.name !== undefined) patch.name = assertName(input.name, "Board name");
    if (input.color !== undefined) patch.color = assertColor(input.color, "board color");
    return this.store.updateBoard(board.id, patch);
  }

  async deleteBoard(actor: Actor, boardId: string) {
    const board = await this.ownedBoard(actor, boardId);
    const boards = await this.store.listBoards(actor.uid);
    if (boards.length <= 1) throw new BoardError("Keep at least one board.");
    const fallback = boards.find((item) => item.id !== board.id);
    if (!fallback) throw new BoardError("Keep at least one board.");
    const cards = (await this.store.listCards(actor.uid)).filter((card) => card.boardId === board.id);
    for (const card of cards) {
      if (card.isSelf) {
        await this.store.updateCard(card.id, { boardId: fallback.id, updatedAt: now() });
        continue;
      }
      const dependencies = await this.store.listDependenciesByCard(card.id);
      for (const dependency of dependencies) await this.deleteOwnedDependency(actor, dependency);
      await this.store.deleteCard(card.id);
    }
    await this.store.deleteBoard(board.id);
  }

  async createCard(
    actor: Actor,
    input: { name?: unknown; color?: unknown; boardId?: unknown },
  ) {
    const user = await this.store.getUser(actor.uid);
    if (!user) throw new BoardError("Sign in required.", 401);
    await this.ensureWorkspace(user);
    const boards = await this.store.listBoards(actor.uid);
    const boardId = typeof input.boardId === "string" && input.boardId ? input.boardId : boards[0]?.id;
    if (!boardId) throw new BoardError("Choose a board.");
    const board = await this.ownedBoard(actor, boardId);
    const card: Card = {
      id: id(),
      ownerId: actor.uid,
      boardId: board.id,
      name: assertName(input.name, "Card name"),
      color: input.color == null || input.color === "" ? defaultCardColor() : assertColor(input.color, "card color"),
      isSelf: false,
      assigneeEmail: null,
      createdAt: now(),
      updatedAt: now(),
    };
    return this.store.createCard(card);
  }

  async updateCard(
    actor: Actor,
    cardId: string,
    input: { name?: unknown; color?: unknown },
  ) {
    const card = await this.ownedCard(actor, cardId);
    const patch: Partial<Card> = { updatedAt: now() };
    if (!card.isSelf && !card.isDone && input.name !== undefined) {
      patch.name = assertName(input.name, "Card name");
    }
    if (input.color !== undefined) patch.color = assertColor(input.color, "card color");
    return this.store.updateCard(card.id, patch);
  }

  async deleteCard(actor: Actor, cardId: string) {
    const card = await this.ownedCard(actor, cardId);
    if (card.isSelf) throw new BoardError("Your Me card stays on the dashboard.");
    if (card.isDone) throw new BoardError("Every board keeps its Done card.");
    const dependencies = await this.store.listDependenciesByCard(card.id);
    for (const dependency of dependencies) {
      await this.deleteOwnedDependency(actor, dependency);
    }
    await this.store.deleteCard(card.id);
  }

  async createDependency(
    actor: Actor,
    input: {
      cardId?: unknown;
      name?: unknown;
      startDate?: unknown;
      deadline?: unknown;
      dependantOnId?: unknown;
      dependantOnLabel?: unknown;
      status?: unknown;
      holdReason?: unknown;
      taskOwner?: unknown;
      assigneeMemberId?: unknown;
      priority?: unknown;
      waitingFor?: unknown;
      blocks?: unknown;
      nextAction?: unknown;
      notes?: unknown;
    },
  ) {
    if (typeof input.cardId !== "string" || !input.cardId) {
      throw new BoardError("Choose a card for this dependency.");
    }
    const { card, board } = await this.cardAccess(actor, input.cardId);
    const siblings = await this.store.listDependenciesByCard(card.id);
    const draft = assertDependencyDraft(input, siblings, null);
    const assignee = await this.resolveAssignee(board, input.assigneeMemberId, draft.taskOwner);
    const timestamp = now();
    const dependency: Dependency = {
      id: id(),
      ownerId: board.ownerId,
      cardId: card.id,
      linkId: id(),
      name: draft.name,
      startDate: draft.startDate,
      deadline: draft.deadline,
      dependantOnId: draft.dependantOnId,
      dependantOnLabel: draft.dependantOnLabel,
      status: card.isDone ? "done" : draft.status,
      holdReason: card.isDone ? null : draft.holdReason,
      taskOwner: assignee.taskOwner,
      assigneeMemberId: assignee.assigneeMemberId,
      doneFromCardId: null,
      priority: draft.priority,
      waitingFor: draft.waitingFor,
      blocks: draft.blocks,
      nextAction: draft.nextAction,
      notes: draft.notes,
      assignedByUid: actor.uid,
      assignedByName: actor.name,
      originCardName: card.name,
      deliveredTo: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.store.createDependency(dependency);
    await this.notifyAssignee(actor, board, dependency, null);
    if (dependency.status === "done") await this.placeForStatus(dependency);
    const saved = (await this.store.getDependency(dependency.id)) ?? dependency;
    return { dependency: saved };
  }

  async updateDependency(
    actor: Actor,
    dependencyId: string,
    input: {
      name?: unknown;
      startDate?: unknown;
      deadline?: unknown;
      dependantOnId?: unknown;
      dependantOnLabel?: unknown;
      status?: unknown;
      holdReason?: unknown;
      taskOwner?: unknown;
      assigneeMemberId?: unknown;
      priority?: unknown;
      waitingFor?: unknown;
      blocks?: unknown;
      nextAction?: unknown;
      notes?: unknown;
    },
  ) {
    const { dependency, board } = await this.editableDependency(actor, dependencyId);
    const siblings = await this.store.listDependenciesByCard(dependency.cardId);
    const draft = assertDependencyDraft(
      {
        name: input.name ?? dependency.name,
        startDate: input.startDate === undefined ? dependency.startDate : input.startDate,
        deadline: input.deadline === undefined ? dependency.deadline : input.deadline,
        dependantOnId:
          input.dependantOnId === undefined ? dependency.dependantOnId : input.dependantOnId,
        dependantOnLabel:
          input.dependantOnLabel === undefined ? dependency.dependantOnLabel : input.dependantOnLabel,
        status: input.status ?? dependency.status,
        holdReason: input.holdReason === undefined ? dependency.holdReason : input.holdReason,
        taskOwner: input.taskOwner === undefined ? dependency.taskOwner : input.taskOwner,
        priority: input.priority === undefined ? dependency.priority : input.priority,
        waitingFor: input.waitingFor === undefined ? dependency.waitingFor : input.waitingFor,
        blocks: input.blocks === undefined ? dependency.blocks : input.blocks,
        nextAction: input.nextAction === undefined ? dependency.nextAction : input.nextAction,
        notes: input.notes === undefined ? dependency.notes : input.notes,
      },
      siblings,
      dependency.id,
    );
    const assignee =
      input.assigneeMemberId === undefined
        ? { assigneeMemberId: dependency.assigneeMemberId ?? null, taskOwner: draft.taskOwner }
        : await this.resolveAssignee(board, input.assigneeMemberId, draft.taskOwner);
    const timestamp = now();
    const updated = await this.store.updateDependency(dependency.id, {
      ...draft,
      ...assignee,
      updatedAt: timestamp,
    });
    await this.notifyAssignee(actor, board, updated, dependency.assigneeMemberId ?? null);
    const statusChanged = draft.status !== dependency.status;
    const placed = statusChanged ? await this.placeForStatus(updated) : updated;
    const linked = await this.store.listDependenciesByLink(dependency.linkId);
    const isSource = dependency.ownerId === dependency.assignedByUid;
    for (const other of linked) {
      if (other.id === dependency.id) continue;
      await this.store.updateDependency(other.id, {
        name: draft.name,
        startDate: draft.startDate,
        deadline: draft.deadline,
        status: draft.status,
        holdReason: draft.holdReason,
        taskOwner: assignee.taskOwner,
        priority: draft.priority,
        waitingFor: draft.waitingFor,
        blocks: draft.blocks,
        nextAction: draft.nextAction,
        notes: draft.notes,
        ...(isSource ? { dependantOnLabel: draft.dependantOnLabel } : {}),
        updatedAt: timestamp,
      });
      if (statusChanged) {
        const synced = await this.store.getDependency(other.id);
        if (synced) await this.placeForStatus(synced);
      }
    }
    if (draft.name !== dependency.name) {
      for (const sibling of siblings) {
        if (sibling.dependantOnId === dependency.id) {
          await this.store.updateDependency(sibling.id, {
            dependantOnLabel: draft.name,
            updatedAt: timestamp,
          });
        }
      }
    }
    return placed;
  }

  async deleteDependency(actor: Actor, dependencyId: string) {
    const dependency = await this.store.getDependency(dependencyId);
    if (dependency && dependency.ownerId !== actor.uid && dependency.assignedByUid === actor.uid) {
      await this.cardAccess(actor, dependency.cardId);
      await this.store.deleteDependency(dependency.id);
      return;
    }
    await this.deleteOwnedDependency(actor, await this.ownedDependency(actor, dependencyId));
  }

  async previewInvite(token: string) {
    const invite = await this.inviteByToken(token);
    const board = invite.boardId ? await this.store.getBoard(invite.boardId) : null;
    if (invite.boardId && !board) throw new BoardError("This board no longer exists.", 404);
    return { fromName: invite.fromName, boardName: board?.name ?? null };
  }

  async acceptInvite(actor: Actor, token: string) {
    const invite = await this.inviteByToken(token);
    if (invite.boardId) return this.joinBoard(actor, invite.boardId);
    if (invite.fromUid === actor.uid) return { status: "self" as const, fromName: invite.fromName, boardId: null };
    const acceptedBy = invite.acceptedBy ?? [];
    if (acceptedBy.includes(actor.uid)) {
      return { status: "already" as const, fromName: invite.fromName, boardId: null };
    }
    await this.store.updateInvite(invite.id, { acceptedBy: [...acceptedBy, actor.uid] });
    await this.notify(actor.uid, "You're in", `${invite.fromName} invited you to TaskOrb. Your board is your own.`);
    await this.notify(invite.fromUid, `${actor.name} joined`, `${actor.name} opened your invite link.`);
    return { status: "accepted" as const, fromName: invite.fromName, boardId: null };
  }

  private async joinBoard(actor: Actor, boardId: string) {
    const board = await this.store.getBoard(boardId);
    if (!board) throw new BoardError("This board no longer exists.", 404);
    const owner = await this.store.getUser(board.ownerId);
    const fromName = owner?.name ?? "The board owner";
    if (board.ownerId === actor.uid) return { status: "self" as const, fromName, boardId: board.id };
    const members = board.members ?? [];
    if (members.some((member) => member.uid === actor.uid)) {
      return { status: "already" as const, fromName, boardId: board.id };
    }
    const email = normalizeEmail(actor.email);
    const timestamp = now();
    const match = members.find((member) => !member.uid && member.email === email);
    const next = match
      ? members.map((member) => (member.id === match.id ? { ...member, uid: actor.uid, joinedAt: timestamp } : member))
      : [...members, { id: id(), name: actor.name, email, uid: actor.uid, addedAt: timestamp, joinedAt: timestamp }];
    await this.saveMembers(board, next);
    await this.notify(actor.uid, `You joined ${board.name}`, `${fromName} shared the ${board.name} board with you.`);
    const waiting = next.filter((member) => !member.uid);
    await this.notify(
      board.ownerId,
      `${actor.name} joined ${board.name}`,
      match || waiting.length === 0
        ? `${actor.name} (${email}) joined the board.`
        : `${actor.name} joined as ${email}. If they were already on the board under another email, merge them in Members.`,
    );
    return { status: "accepted" as const, fromName, boardId: board.id };
  }

  async moveDependency(actor: Actor, dependencyId: string, cardId: unknown) {
    if (typeof cardId !== "string" || !cardId) throw new BoardError("Choose a card to drop this on.");
    const dependency = await this.ownedDependency(actor, dependencyId);
    const card = await this.ownedCard(actor, cardId);
    if (dependency.cardId === card.id) return dependency;
    const source = await this.ownedCard(actor, dependency.cardId);
    if (source.boardId !== card.boardId) {
      throw new BoardError("Drop a task on a card in the same board.");
    }
    const patch: Partial<Dependency> = {};
    if (card.isDone && !source.isDone) {
      Object.assign(patch, { status: "done", holdReason: null, doneFromCardId: source.id });
    } else if (!card.isDone && source.isDone) {
      Object.assign(patch, { doneFromCardId: null, ...(dependency.status === "done" ? { status: "open" } : {}) });
    }
    await this.relocate(dependency, card, patch);
    return fillDependency((await this.store.getDependency(dependency.id)) ?? dependency);
  }

  async markNotificationRead(actor: Actor, notificationId: string) {
    await this.store.markNotificationRead(notificationId, actor.uid);
  }

  async markAllNotificationsRead(actor: Actor) {
    await this.store.markAllNotificationsRead(actor.uid);
  }

  private async ensureWorkspace(user: UserProfile) {
    let boards = await this.store.listBoards(user.uid);
    if (boards.length === 0) {
      const start = Date.now();
      boards = [];
      for (const [index, preset] of DEFAULT_BOARDS.entries()) {
        const stamp = new Date(start + index).toISOString();
        boards.push(
          await this.store.createBoard({
            id: `${user.uid}-default-${index + 1}`,
            ownerId: user.uid,
            name: preset.name,
            color: preset.color,
            createdAt: stamp,
            updatedAt: stamp,
          }),
        );
      }
    }
    const home = boards[0];
    const cards = await this.store.listCards(user.uid);
    for (const card of cards) {
      if (!card.boardId) await this.store.updateCard(card.id, { boardId: home.id });
    }
    const refreshed = await this.store.listCards(user.uid);
    if (!refreshed.some((card) => card.isSelf)) {
      await this.store.createCard({
        id: id(),
        ownerId: user.uid,
        boardId: home.id,
        name: "Me",
        color: defaultCardColor(),
        isSelf: true,
        assigneeEmail: null,
        createdAt: now(),
        updatedAt: now(),
      });
    }
    for (const board of boards) {
      if (!refreshed.some((card) => card.boardId === board.id && card.isDone)) await this.doneCard(board);
    }
    return home;
  }

  private async doneCard(board: Board) {
    const cards = await this.store.listCardsByBoard(board.id);
    const existing = cards.find((card) => card.isDone);
    if (existing) return existing;
    const stamp = now();
    const done = await this.store.createCard({
      id: `${board.id}-done`,
      ownerId: board.ownerId,
      boardId: board.id,
      name: "Done",
      color: DONE_CARD_COLOR,
      isSelf: false,
      isDone: true,
      assigneeEmail: null,
      createdAt: stamp,
      updatedAt: stamp,
    });
    for (const card of cards) {
      for (const task of await this.store.listDependenciesByCard(card.id)) {
        if (task.status === "done") await this.relocate(task, done, { doneFromCardId: card.id });
      }
    }
    return done;
  }

  private async placeForStatus(task: Dependency) {
    const card = await this.store.getCard(task.cardId);
    if (!card) return task;
    if (task.status === "done" && !card.isDone) {
      const board = await this.store.getBoard(card.boardId);
      if (!board) return task;
      return this.relocate(task, await this.doneCard(board), { doneFromCardId: card.id });
    }
    if (task.status !== "done" && card.isDone) {
      const cards = (await this.store.listCardsByBoard(card.boardId)).filter((item) => !item.isDone);
      const back =
        cards.find((item) => item.id === task.doneFromCardId) ??
        cards.find((item) => item.isSelf) ??
        [...cards].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!back) return task;
      return this.relocate(task, back, { doneFromCardId: null });
    }
    return task;
  }

  private async relocate(task: Dependency, target: Card, patch: Partial<Dependency> = {}) {
    const timestamp = now();
    if (task.cardId === target.id) return this.store.updateDependency(task.id, { ...patch, updatedAt: timestamp });
    const destination = await this.store.listDependenciesByCard(target.id);
    const parentStays = Boolean(task.dependantOnId && !destination.some((item) => item.id === task.dependantOnId));
    const updated = await this.store.updateDependency(task.id, {
      cardId: target.id,
      originCardName: target.name,
      dependantOnId: parentStays ? null : task.dependantOnId,
      ...patch,
      updatedAt: timestamp,
    });
    for (const sibling of await this.store.listDependenciesByCard(task.cardId)) {
      if (sibling.dependantOnId !== task.id) continue;
      await this.store.updateDependency(sibling.id, {
        dependantOnId: null,
        dependantOnLabel: sibling.dependantOnLabel || task.name,
        updatedAt: timestamp,
      });
    }
    return updated;
  }

  private async ownedBoard(actor: Actor, boardId: string) {
    const board = await this.store.getBoard(boardId);
    if (!board || board.ownerId !== actor.uid) throw new BoardError("Board not found.", 404);
    return board;
  }

  private async ownedCard(actor: Actor, cardId: string) {
    const card = await this.store.getCard(cardId);
    if (!card || card.ownerId !== actor.uid) throw new BoardError("Card not found.", 404);
    return card;
  }

  private async ownedDependency(actor: Actor, dependencyId: string) {
    const dependency = await this.store.getDependency(dependencyId);
    if (!dependency || dependency.ownerId !== actor.uid) {
      throw new BoardError("Dependency not found.", 404);
    }
    return dependency;
  }

  private async cardAccess(actor: Actor, cardId: string) {
    const card = await this.store.getCard(cardId);
    const board = card ? await this.store.getBoard(card.boardId) : null;
    if (!card || !board) throw new BoardError("Card not found.", 404);
    if (board.ownerId === actor.uid) return { card, board, member: null };
    const member = (board.members ?? []).find((item) => item.uid === actor.uid);
    if (!member) throw new BoardError("Card not found.", 404);
    return { card, board, member };
  }

  private async editableDependency(actor: Actor, dependencyId: string) {
    const dependency = await this.store.getDependency(dependencyId);
    if (!dependency) throw new BoardError("Dependency not found.", 404);
    const { board, member } = await this.cardAccess(actor, dependency.cardId).catch(() => {
      throw new BoardError("Dependency not found.", 404);
    });
    const allowed =
      dependency.ownerId === actor.uid ||
      dependency.assignedByUid === actor.uid ||
      (member !== null && dependency.assigneeMemberId === member.id);
    if (!allowed) throw new BoardError("Only the board owner, the task's creator, or its assignee can change it.", 403);
    return { dependency: fillDependency(dependency), board };
  }

  private async resolveAssignee(board: Board, value: unknown, fallbackText: string | null) {
    if (value == null || value === "") return { assigneeMemberId: null, taskOwner: fallbackText };
    if (value === OWNER_ASSIGNEE) {
      const owner = await this.store.getUser(board.ownerId);
      return { assigneeMemberId: OWNER_ASSIGNEE, taskOwner: owner?.name ?? "Board owner" };
    }
    const member = (board.members ?? []).find((item) => item.id === value);
    if (!member) throw new BoardError("Pick an owner from the board's members.");
    return { assigneeMemberId: member.id, taskOwner: member.name };
  }

  private async notifyAssignee(actor: Actor, board: Board, task: Dependency, previous: string | null) {
    if (!task.assigneeMemberId || task.assigneeMemberId === previous) return;
    const uid =
      task.assigneeMemberId === OWNER_ASSIGNEE
        ? board.ownerId
        : (board.members ?? []).find((member) => member.id === task.assigneeMemberId)?.uid;
    if (!uid || uid === actor.uid) return;
    await this.notify(uid, "New task for you", `${actor.name} assigned you "${task.name}" on ${board.name}.`, task.id);
  }

  private async boardTasks(boardId: string) {
    const tasks: Dependency[] = [];
    for (const card of await this.store.listCardsByBoard(boardId)) {
      tasks.push(...(await this.store.listDependenciesByCard(card.id)));
    }
    return tasks;
  }

  private async saveMembers(board: Board, members: BoardMember[]) {
    const memberUids = [...new Set(members.map((member) => member.uid).filter((uid): uid is string => Boolean(uid)))];
    return this.store.updateBoard(board.id, { members, memberUids, updatedAt: now() });
  }

  private async notify(userId: string, title: string, body: string, dependencyId: string | null = null) {
    await this.store.createNotification({ id: id(), userId, title, body, dependencyId, read: false, createdAt: now() });
    if (this.pusher) void this.deliver(userId, title, body).catch(() => undefined);
  }

  private async deliver(userId: string, title: string, body: string) {
    const devices = await this.store.listPushDevices(userId);
    if (!devices.length || !this.pusher) return;
    const dead = await this.pusher.send(devices, { title, body, url: "/" });
    for (const deviceId of dead) await this.store.deletePushDevice(deviceId);
  }

  private async deleteOwnedDependency(actor: Actor, dependency: Dependency) {
    const linked = await this.store.listDependenciesByLink(dependency.linkId);
    const isSource = dependency.assignedByUid === actor.uid && dependency.ownerId === actor.uid;
    if (isSource) {
      for (const item of linked) await this.store.deleteDependency(item.id);
      return;
    }
    await this.store.deleteDependency(dependency.id);
  }

  private publicInvite(invite: { token: string }, origin?: string) {
    const base = (origin || this.appUrl).replace(/\/$/, "");
    return { url: `${base}/invite/${invite.token}`, token: invite.token };
  }

  private async inviteByToken(token: string) {
    if (!token) throw new BoardError("This invite link is not valid.", 404);
    const invite = await this.store.getInviteByToken(token);
    if (!invite) throw new BoardError("This invite link is not valid.", 404);
    return invite;
  }
}

function deviceId(key: string) {
  return createHash("sha256").update(key).digest("base64url").slice(0, 32);
}

function inviteToken() {
  return randomBytes(18).toString("base64url");
}

function fillBoard(board: Board, ownerName: string): Board {
  return { ...board, members: board.members ?? [], memberUids: board.memberUids ?? [], ownerName };
}

function fillDependency(item: Dependency): Dependency {
  return {
    ...item,
    taskOwner: item.taskOwner ?? null,
    assigneeMemberId: item.assigneeMemberId ?? null,
    doneFromCardId: item.doneFromCardId ?? null,
    priority: item.priority ?? null,
    waitingFor: item.waitingFor ?? null,
    blocks: item.blocks ?? null,
    nextAction: item.nextAction ?? null,
    startDate: item.startDate ?? null,
    notes: item.notes ?? null,
  };
}

