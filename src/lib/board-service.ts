import { randomBytes, randomUUID } from "crypto";
import {
  assertColor,
  assertDependencyDraft,
  assertEmail,
  assertName,
  defaultCardColor,
  todayISO,
} from "./domain";
import { BoardError } from "./errors";
import type { Store } from "./store";
import type { Board, Card, Dependency, SessionUser, UserProfile } from "./types";

type Actor = SessionUser;

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
  ) {}

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
    const boards = await this.store.listBoards(actor.uid);
    const cards = await this.store.listCards(actor.uid);
    const dependencies = (await this.store.listDependenciesByOwner(actor.uid)).map(fillDependency);
    const notifications = await this.store.listNotifications(actor.uid);
    return { user, boards, cards, dependencies, notifications };
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
    return this.store.createBoard(board);
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
    if (!card.isSelf && input.name !== undefined) {
      patch.name = assertName(input.name, "Card name");
    }
    if (input.color !== undefined) patch.color = assertColor(input.color, "card color");
    return this.store.updateCard(card.id, patch);
  }

  async deleteCard(actor: Actor, cardId: string) {
    const card = await this.ownedCard(actor, cardId);
    if (card.isSelf) throw new BoardError("Your Me card stays on the dashboard.");
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
      lastUpdate?: unknown;
      notes?: unknown;
    },
  ) {
    if (typeof input.cardId !== "string" || !input.cardId) {
      throw new BoardError("Choose a card for this dependency.");
    }
    const card = await this.ownedCard(actor, input.cardId);
    const siblings = await this.store.listDependenciesByCard(card.id);
    const draft = assertDependencyDraft(input, siblings, null);
    const timestamp = now();
    const dependency: Dependency = {
      id: id(),
      ownerId: actor.uid,
      cardId: card.id,
      linkId: id(),
      name: draft.name,
      deadline: draft.deadline,
      dependantOnId: draft.dependantOnId,
      dependantOnLabel: draft.dependantOnLabel,
      status: draft.status,
      holdReason: draft.holdReason,
      taskOwner: draft.taskOwner,
      priority: draft.priority,
      waitingFor: draft.waitingFor,
      blocks: draft.blocks,
      nextAction: draft.nextAction,
      lastUpdate: draft.lastUpdate ?? todayISO(),
      notes: draft.notes,
      assignedByUid: actor.uid,
      assignedByName: actor.name,
      originCardName: card.name,
      deliveredTo: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.store.createDependency(dependency);
    const saved = (await this.store.getDependency(dependency.id)) ?? dependency;
    return { dependency: saved };
  }

  async updateDependency(
    actor: Actor,
    dependencyId: string,
    input: {
      name?: unknown;
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
      lastUpdate?: unknown;
      notes?: unknown;
    },
  ) {
    const dependency = await this.ownedDependency(actor, dependencyId);
    const siblings = await this.store.listDependenciesByCard(dependency.cardId);
    const draft = assertDependencyDraft(
      {
        name: input.name ?? dependency.name,
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
        lastUpdate: input.lastUpdate === undefined ? dependency.lastUpdate : input.lastUpdate,
        notes: input.notes === undefined ? dependency.notes : input.notes,
      },
      siblings,
      dependency.id,
    );
    const timestamp = now();
    const updated = await this.store.updateDependency(dependency.id, {
      ...draft,
      updatedAt: timestamp,
    });
    const linked = await this.store.listDependenciesByLink(dependency.linkId);
    const isSource = dependency.ownerId === dependency.assignedByUid;
    for (const other of linked) {
      if (other.id === dependency.id) continue;
      await this.store.updateDependency(other.id, {
        name: draft.name,
        deadline: draft.deadline,
        status: draft.status,
        holdReason: draft.holdReason,
        taskOwner: draft.taskOwner,
        priority: draft.priority,
        waitingFor: draft.waitingFor,
        blocks: draft.blocks,
        nextAction: draft.nextAction,
        lastUpdate: draft.lastUpdate,
        notes: draft.notes,
        ...(isSource ? { dependantOnLabel: draft.dependantOnLabel } : {}),
        updatedAt: timestamp,
      });
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
    return updated;
  }

  async deleteDependency(actor: Actor, dependencyId: string) {
    const dependency = await this.ownedDependency(actor, dependencyId);
    await this.deleteOwnedDependency(actor, dependency);
  }

  async inviteLink(actor: Actor, origin?: string) {
    const user = await this.store.getUser(actor.uid);
    if (!user) throw new BoardError("Sign in required.", 401);
    const existing = await this.store.findInviteByFrom(actor.uid);
    if (existing?.token) return this.publicInvite(existing, origin);
    const invite = existing
      ? await this.store.updateInvite(existing.id, {
          token: inviteToken(),
          fromName: actor.name,
          acceptedBy: existing.acceptedBy ?? [],
        })
      : await this.store.createInvite({
          id: id(),
          token: inviteToken(),
          email: null,
          fromUid: actor.uid,
          fromName: actor.name,
          acceptedBy: [],
          createdAt: now(),
        });
    return this.publicInvite(invite, origin);
  }

  async previewInvite(token: string) {
    const invite = await this.inviteByToken(token);
    return { fromName: invite.fromName };
  }

  async acceptInvite(actor: Actor, token: string) {
    const invite = await this.inviteByToken(token);
    if (invite.fromUid === actor.uid) return { status: "self" as const, fromName: invite.fromName };
    const acceptedBy = invite.acceptedBy ?? [];
    if (acceptedBy.includes(actor.uid)) return { status: "already" as const, fromName: invite.fromName };
    await this.store.updateInvite(invite.id, { acceptedBy: [...acceptedBy, actor.uid] });
    const timestamp = now();
    await this.store.createNotification({
      id: id(),
      userId: actor.uid,
      title: "You're in",
      body: `${invite.fromName} invited you to Hitch. Your board is your own.`,
      dependencyId: null,
      read: false,
      createdAt: timestamp,
    });
    await this.store.createNotification({
      id: id(),
      userId: invite.fromUid,
      title: `${actor.name} joined`,
      body: `${actor.name} opened your invite link.`,
      dependencyId: null,
      read: false,
      createdAt: timestamp,
    });
    return { status: "accepted" as const, fromName: invite.fromName };
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

    const destination = await this.store.listDependenciesByCard(card.id);
    const parentStays = Boolean(
      dependency.dependantOnId && !destination.some((item) => item.id === dependency.dependantOnId),
    );
    const timestamp = now();
    const updated = await this.store.updateDependency(dependency.id, {
      cardId: card.id,
      originCardName: card.name,
      dependantOnId: parentStays ? null : dependency.dependantOnId,
      dependantOnLabel: dependency.dependantOnLabel,
      updatedAt: timestamp,
    });

    const leftBehind = await this.store.listDependenciesByCard(dependency.cardId);
    for (const sibling of leftBehind) {
      if (sibling.dependantOnId !== dependency.id) continue;
      await this.store.updateDependency(sibling.id, {
        dependantOnId: null,
        dependantOnLabel: sibling.dependantOnLabel || dependency.name,
        updatedAt: timestamp,
      });
    }

    return (await this.store.getDependency(dependency.id)) ?? updated;
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
      const created = await this.store.createBoard({
        id: id(),
        ownerId: user.uid,
        name: "Main",
        color: "#0c66e4",
        createdAt: now(),
        updatedAt: now(),
      });
      boards = [created];
    }
    const home = boards[0];
    const cards = await this.store.listCards(user.uid);
    for (const card of cards) {
      if (!card.boardId) await this.store.updateCard(card.id, { boardId: home.id });
    }
    const refreshed = await this.store.listCards(user.uid);
    if (refreshed.some((card) => card.isSelf)) return home;
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
    return home;
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

function inviteToken() {
  return randomBytes(18).toString("base64url");
}

function fillDependency(item: Dependency): Dependency {
  return {
    ...item,
    taskOwner: item.taskOwner ?? null,
    priority: item.priority ?? null,
    waitingFor: item.waitingFor ?? null,
    blocks: item.blocks ?? null,
    nextAction: item.nextAction ?? null,
    lastUpdate: item.lastUpdate ?? null,
    notes: item.notes ?? null,
  };
}

