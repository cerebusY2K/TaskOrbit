export const STATUSES = ["open", "hold", "wip", "done"] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  hold: "On hold",
  wip: "In Progress",
  done: "Done",
};

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const CARD_COLORS = [
  "#0f6e6e",
  "#c4553a",
  "#c4882a",
  "#2c4f8f",
  "#6d4c8a",
  "#2f6b45",
  "#8d3d55",
  "#3e4c59",
] as const;

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  createdAt: string;
};

export type BoardMember = {
  id: string;
  name: string;
  email: string;
  uid: string | null;
  addedAt: string;
  joinedAt: string | null;
};

export const OWNER_ASSIGNEE = "owner";

export type Board = {
  id: string;
  ownerId: string;
  name: string;
  color: string;
  members?: BoardMember[];
  memberUids?: string[];
  ownerName?: string;
  createdAt: string;
  updatedAt: string;
};

export type Card = {
  id: string;
  ownerId: string;
  boardId: string;
  name: string;
  color: string;
  isSelf: boolean;
  assigneeEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Dependency = {
  id: string;
  ownerId: string;
  cardId: string;
  linkId: string;
  name: string;
  deadline: string | null;
  dependantOnId: string | null;
  dependantOnLabel: string | null;
  status: Status;
  holdReason: string | null;
  taskOwner: string | null;
  assigneeMemberId: string | null;
  priority: Priority | null;
  waitingFor: string | null;
  blocks: string | null;
  nextAction: string | null;
  lastUpdate: string | null;
  notes: string | null;
  assignedByUid: string;
  assignedByName: string;
  originCardName: string;
  deliveredTo: string[];
  createdAt: string;
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  dependencyId: string | null;
  read: boolean;
  createdAt: string;
};

export type PendingAssignment = {
  id: string;
  email: string;
  fromUid: string;
  fromName: string;
  originCardName: string;
  linkId: string;
  name: string;
  deadline: string | null;
  dependantOnLabel: string | null;
  status: Status;
  holdReason: string | null;
  createdAt: string;
};

export type InviteRecord = {
  id: string;
  token: string;
  boardId?: string | null;
  email: string | null;
  fromUid: string;
  fromName: string;
  acceptedBy: string[];
  createdAt: string;
};

export type OutboxMessage = {
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  error: string | null;
  createdAt: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailStatus = "sent" | "queued" | "failed" | "skipped";

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
};

export type BoardPayload = {
  user: UserProfile;
  boards: Board[];
  cards: Card[];
  dependencies: Dependency[];
  notifications: AppNotification[];
};
