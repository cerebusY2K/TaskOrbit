import type {
  AppNotification,
  Board,
  Card,
  Dependency,
  InviteRecord,
  OutboxMessage,
  PendingAssignment,
  PushDevice,
  UserProfile,
} from "./types";

export interface Store {
  upsertUser(user: UserProfile): Promise<UserProfile>;
  getUser(uid: string): Promise<UserProfile | null>;
  findUserByEmail(email: string): Promise<UserProfile | null>;

  listBoards(ownerId: string): Promise<Board[]>;
  listSharedBoards(uid: string): Promise<Board[]>;
  getBoard(id: string): Promise<Board | null>;
  createBoard(board: Board): Promise<Board>;
  updateBoard(id: string, patch: Partial<Board>): Promise<Board>;
  deleteBoard(id: string): Promise<void>;

  listCards(ownerId: string): Promise<Card[]>;
  listCardsByBoard(boardId: string): Promise<Card[]>;
  getCard(id: string): Promise<Card | null>;
  createCard(card: Card): Promise<Card>;
  updateCard(id: string, patch: Partial<Card>): Promise<Card>;
  deleteCard(id: string): Promise<void>;

  listDependenciesByOwner(ownerId: string): Promise<Dependency[]>;
  listDependenciesByCard(cardId: string): Promise<Dependency[]>;
  listDependenciesByLink(linkId: string): Promise<Dependency[]>;
  getDependency(id: string): Promise<Dependency | null>;
  createDependency(dependency: Dependency): Promise<Dependency>;
  updateDependency(id: string, patch: Partial<Dependency>): Promise<Dependency>;
  deleteDependency(id: string): Promise<void>;

  listNotifications(userId: string): Promise<AppNotification[]>;
  createNotification(notification: AppNotification): Promise<AppNotification>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  listPendingByEmail(email: string): Promise<PendingAssignment[]>;
  createPending(pending: PendingAssignment): Promise<PendingAssignment>;
  deletePending(id: string): Promise<void>;

  createInvite(invite: InviteRecord): Promise<InviteRecord>;
  getInviteByToken(token: string): Promise<InviteRecord | null>;
  findInviteByFrom(uid: string): Promise<InviteRecord | null>;
  findInviteByBoard(boardId: string): Promise<InviteRecord | null>;
  updateInvite(id: string, patch: Partial<InviteRecord>): Promise<InviteRecord>;
  saveOutbox(message: OutboxMessage): Promise<void>;

  savePushDevice(device: PushDevice): Promise<void>;
  listPushDevices(uid: string): Promise<PushDevice[]>;
  deletePushDevice(id: string): Promise<void>;
}

export type StoreSnapshot = {
  users: UserProfile[];
  boards?: Board[];
  cards: Card[];
  dependencies: Dependency[];
  notifications: AppNotification[];
  pending: PendingAssignment[];
  invites: InviteRecord[];
  outbox: OutboxMessage[];
  pushDevices?: PushDevice[];
};

export class MemoryStore implements Store {
  users = new Map<string, UserProfile>();
  boards = new Map<string, Board>();
  cards = new Map<string, Card>();
  dependencies = new Map<string, Dependency>();
  notifications = new Map<string, AppNotification>();
  pending = new Map<string, PendingAssignment>();
  invites: InviteRecord[] = [];
  outbox: OutboxMessage[] = [];
  pushDevices = new Map<string, PushDevice>();
  onChange?: () => void;

  private touch() {
    this.onChange?.();
  }

  load(snapshot: StoreSnapshot) {
    this.users = new Map(snapshot.users.map((item) => [item.uid, item]));
    this.boards = new Map((snapshot.boards ?? []).map((item) => [item.id, item]));
    this.cards = new Map(snapshot.cards.map((item) => [item.id, item]));
    this.dependencies = new Map(snapshot.dependencies.map((item) => [item.id, item]));
    this.notifications = new Map(snapshot.notifications.map((item) => [item.id, item]));
    this.pending = new Map(snapshot.pending.map((item) => [item.id, item]));
    this.invites = snapshot.invites;
    this.outbox = snapshot.outbox;
    this.pushDevices = new Map((snapshot.pushDevices ?? []).map((item) => [item.id, item]));
  }

  dump(): StoreSnapshot {
    return {
      users: [...this.users.values()],
      boards: [...this.boards.values()],
      cards: [...this.cards.values()],
      dependencies: [...this.dependencies.values()],
      notifications: [...this.notifications.values()],
      pending: [...this.pending.values()],
      invites: this.invites,
      outbox: this.outbox,
      pushDevices: [...this.pushDevices.values()],
    };
  }

  async upsertUser(user: UserProfile) {
    const existing = this.users.get(user.uid);
    const next = { ...user, createdAt: existing?.createdAt ?? user.createdAt };
    this.users.set(user.uid, next);
    this.touch();
    return next;
  }

  async getUser(uid: string) {
    return this.users.get(uid) ?? null;
  }

  async findUserByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async listBoards(ownerId: string) {
    return [...this.boards.values()]
      .filter((board) => board.ownerId === ownerId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listSharedBoards(uid: string) {
    return [...this.boards.values()]
      .filter((board) => board.memberUids?.includes(uid))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getBoard(id: string) {
    return this.boards.get(id) ?? null;
  }

  async createBoard(board: Board) {
    this.boards.set(board.id, board);
    this.touch();
    return board;
  }

  async updateBoard(id: string, patch: Partial<Board>) {
    const current = this.boards.get(id);
    if (!current) throw new Error("Board missing.");
    const next = { ...current, ...patch, id: current.id, ownerId: current.ownerId };
    this.boards.set(id, next);
    this.touch();
    return next;
  }

  async deleteBoard(id: string) {
    this.boards.delete(id);
    this.touch();
  }

  async listCards(ownerId: string) {
    return [...this.cards.values()]
      .filter((card) => card.ownerId === ownerId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listCardsByBoard(boardId: string) {
    return [...this.cards.values()]
      .filter((card) => card.boardId === boardId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getCard(id: string) {
    return this.cards.get(id) ?? null;
  }

  async createCard(card: Card) {
    this.cards.set(card.id, card);
    this.touch();
    return card;
  }

  async updateCard(id: string, patch: Partial<Card>) {
    const current = this.cards.get(id);
    if (!current) throw new Error("Card missing.");
    const next = { ...current, ...patch, id: current.id, ownerId: current.ownerId };
    this.cards.set(id, next);
    this.touch();
    return next;
  }

  async deleteCard(id: string) {
    this.cards.delete(id);
    this.touch();
  }

  async listDependenciesByOwner(ownerId: string) {
    return [...this.dependencies.values()]
      .filter((item) => item.ownerId === ownerId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listDependenciesByCard(cardId: string) {
    return [...this.dependencies.values()]
      .filter((item) => item.cardId === cardId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listDependenciesByLink(linkId: string) {
    return [...this.dependencies.values()].filter((item) => item.linkId === linkId);
  }

  async getDependency(id: string) {
    return this.dependencies.get(id) ?? null;
  }

  async createDependency(dependency: Dependency) {
    this.dependencies.set(dependency.id, dependency);
    this.touch();
    return dependency;
  }

  async updateDependency(id: string, patch: Partial<Dependency>) {
    const current = this.dependencies.get(id);
    if (!current) throw new Error("Dependency missing.");
    const next = {
      ...current,
      ...patch,
      id: current.id,
      ownerId: current.ownerId,
      cardId: patch.cardId ?? current.cardId,
      linkId: current.linkId,
    };
    this.dependencies.set(id, next);
    this.touch();
    return next;
  }

  async deleteDependency(id: string) {
    this.dependencies.delete(id);
    this.touch();
  }

  async listNotifications(userId: string) {
    return [...this.notifications.values()]
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createNotification(notification: AppNotification) {
    this.notifications.set(notification.id, notification);
    this.touch();
    return notification;
  }

  async markNotificationRead(id: string, userId: string) {
    const current = this.notifications.get(id);
    if (!current || current.userId !== userId) return;
    this.notifications.set(id, { ...current, read: true });
    this.touch();
  }

  async markAllNotificationsRead(userId: string) {
    for (const item of this.notifications.values()) {
      if (item.userId === userId) this.notifications.set(item.id, { ...item, read: true });
    }
    this.touch();
  }

  async listPendingByEmail(email: string) {
    return [...this.pending.values()].filter((item) => item.email === email);
  }

  async createPending(pending: PendingAssignment) {
    this.pending.set(pending.id, pending);
    this.touch();
    return pending;
  }

  async deletePending(id: string) {
    this.pending.delete(id);
    this.touch();
  }

  async createInvite(invite: InviteRecord) {
    this.invites.push(invite);
    this.touch();
    return invite;
  }

  async getInviteByToken(token: string) {
    return this.invites.find((invite) => invite.token === token) ?? null;
  }

  async findInviteByFrom(uid: string) {
    return this.invites.find((invite) => invite.fromUid === uid && !invite.boardId) ?? null;
  }

  async findInviteByBoard(boardId: string) {
    return this.invites.find((invite) => invite.boardId === boardId) ?? null;
  }

  async updateInvite(id: string, patch: Partial<InviteRecord>) {
    const index = this.invites.findIndex((invite) => invite.id === id);
    if (index < 0) throw new Error("Invite missing.");
    const current = this.invites[index];
    const next = {
      ...current,
      ...patch,
      id: current.id,
      fromUid: current.fromUid,
      token: patch.token || current.token,
    };
    this.invites[index] = next;
    this.touch();
    return next;
  }

  async saveOutbox(message: OutboxMessage) {
    this.outbox.push(message);
    this.touch();
  }

  async savePushDevice(device: PushDevice) {
    this.pushDevices.set(device.id, device);
    this.touch();
  }

  async listPushDevices(uid: string) {
    return [...this.pushDevices.values()].filter((device) => device.uid === uid);
  }

  async deletePushDevice(id: string) {
    this.pushDevices.delete(id);
    this.touch();
  }
}
