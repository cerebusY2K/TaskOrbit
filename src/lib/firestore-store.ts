import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { BoardError } from "./errors";
import type { Store } from "./store";
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

let app: App | null = null;
let firestore: Firestore | null = null;

export function firebaseAdminConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
}

export function getAdminApp() {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!json && !path) throw new Error("Firebase service account is not configured.");
  const credentials = json ? JSON.parse(json) : JSON.parse(readFileSync(path!, "utf8"));
  app = initializeApp({ credential: cert(credentials) });
  return app;
}

function db(): Firestore {
  if (firestore) return firestore;
  const databaseId = process.env.FIRESTORE_DATABASE_ID;
  firestore =
    !databaseId || databaseId === "(default)"
      ? getFirestore(getAdminApp())
      : getFirestore(getAdminApp(), databaseId);
  try {
    firestore.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() throws once the instance has been used, e.g. after a dev hot reload.
  }
  return firestore;
}

export async function verifyFirebaseToken(idToken: string) {
  if (firebaseAdminConfigured()) {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    let email = decoded.email ?? null;
    let name = decoded.name ?? null;
    let photoURL = decoded.picture ?? null;
    if (!email || !name) {
      const user = await getAuth(getAdminApp()).getUser(decoded.uid);
      email = email ?? user.email ?? null;
      name = name ?? user.displayName ?? null;
      photoURL = photoURL ?? user.photoURL ?? null;
    }
    const google = decoded.firebase?.sign_in_provider === "google.com";
    if (!google) throw new BoardError("Sign in with Google.", 401);
    return { uid: decoded.uid, email, name, photoURL };
  }

  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw new BoardError("Google sign-in is not configured.", 503);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  const data = (await response.json()) as {
    users?: Array<{
      localId?: string;
      email?: string;
      displayName?: string;
      photoUrl?: string;
      providerUserInfo?: Array<{ providerId?: string }>;
    }>;
  };
  const user = data.users?.[0];
  if (!response.ok || !user?.localId) {
    throw new BoardError("Google sign-in could not be verified.", 401);
  }
  const google = (user.providerUserInfo ?? []).some((item) => item.providerId === "google.com");
  if (!google) throw new BoardError("Sign in with Google.", 401);
  return {
    uid: user.localId,
    email: user.email ?? null,
    name: user.displayName ?? null,
    photoURL: user.photoUrl ?? null,
  };
}

export class FirestoreStore implements Store {
  private collection(name: string) {
    return db().collection(name);
  }

  async upsertUser(user: UserProfile) {
    const ref = this.collection("users").doc(user.uid);
    const existing = await ref.get();
    const next = {
      ...user,
      createdAt: existing.exists ? (existing.data()?.createdAt as string) : user.createdAt,
    };
    await ref.set(next);
    return next;
  }

  async getUser(uid: string) {
    const snap = await this.collection("users").doc(uid).get();
    return snap.exists ? (snap.data() as UserProfile) : null;
  }

  async findUserByEmail(email: string) {
    const snap = await this.collection("users").where("email", "==", email).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].data() as UserProfile;
  }

  async listBoards(ownerId: string) {
    const snap = await this.collection("boards").where("ownerId", "==", ownerId).get();
    return snap.docs
      .map((doc) => doc.data() as Board)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listSharedBoards(uid: string) {
    const snap = await this.collection("boards").where("memberUids", "array-contains", uid).get();
    return snap.docs
      .map((doc) => doc.data() as Board)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getBoard(id: string) {
    const snap = await this.collection("boards").doc(id).get();
    return snap.exists ? (snap.data() as Board) : null;
  }

  async createBoard(board: Board) {
    await this.collection("boards").doc(board.id).set(board);
    return board;
  }

  async updateBoard(id: string, patch: Partial<Board>) {
    const ref = this.collection("boards").doc(id);
    await ref.set(patch, { merge: true });
    const snap = await ref.get();
    return snap.data() as Board;
  }

  async deleteBoard(id: string) {
    await this.collection("boards").doc(id).delete();
  }

  async listCards(ownerId: string) {
    const snap = await this.collection("cards").where("ownerId", "==", ownerId).get();
    return snap.docs
      .map((doc) => doc.data() as Card)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listCardsByBoard(boardId: string) {
    const snap = await this.collection("cards").where("boardId", "==", boardId).get();
    return snap.docs
      .map((doc) => doc.data() as Card)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getCard(id: string) {
    const snap = await this.collection("cards").doc(id).get();
    return snap.exists ? (snap.data() as Card) : null;
  }

  async createCard(card: Card) {
    await this.collection("cards").doc(card.id).set(card);
    return card;
  }

  async updateCard(id: string, patch: Partial<Card>) {
    const ref = this.collection("cards").doc(id);
    await ref.set(patch, { merge: true });
    const snap = await ref.get();
    return snap.data() as Card;
  }

  async deleteCard(id: string) {
    await this.collection("cards").doc(id).delete();
  }

  async listDependenciesByOwner(ownerId: string) {
    const snap = await this.collection("dependencies").where("ownerId", "==", ownerId).get();
    return snap.docs
      .map((doc) => doc.data() as Dependency)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listDependenciesByCard(cardId: string) {
    const snap = await this.collection("dependencies").where("cardId", "==", cardId).get();
    return snap.docs
      .map((doc) => doc.data() as Dependency)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listDependenciesByLink(linkId: string) {
    const snap = await this.collection("dependencies").where("linkId", "==", linkId).get();
    return snap.docs.map((doc) => doc.data() as Dependency);
  }

  async getDependency(id: string) {
    const snap = await this.collection("dependencies").doc(id).get();
    return snap.exists ? (snap.data() as Dependency) : null;
  }

  async createDependency(dependency: Dependency) {
    await this.collection("dependencies").doc(dependency.id).set(dependency);
    return dependency;
  }

  async updateDependency(id: string, patch: Partial<Dependency>) {
    const ref = this.collection("dependencies").doc(id);
    await ref.set(patch, { merge: true });
    const snap = await ref.get();
    return snap.data() as Dependency;
  }

  async deleteDependency(id: string) {
    await this.collection("dependencies").doc(id).delete();
  }

  async listNotifications(userId: string) {
    const snap = await this.collection("notifications").where("userId", "==", userId).get();
    return snap.docs
      .map((doc) => doc.data() as AppNotification)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createNotification(notification: AppNotification) {
    await this.collection("notifications").doc(notification.id).set(notification);
    return notification;
  }

  async markNotificationRead(id: string, userId: string) {
    const ref = this.collection("notifications").doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.userId !== userId) return;
    await ref.set({ read: true }, { merge: true });
  }

  async markAllNotificationsRead(userId: string) {
    const snap = await this.collection("notifications").where("userId", "==", userId).get();
    const batch = db().batch();
    snap.docs.forEach((doc) => batch.set(doc.ref, { read: true }, { merge: true }));
    await batch.commit();
  }

  async listPendingByEmail(email: string) {
    const snap = await this.collection("pendingAssignments").where("email", "==", email).get();
    return snap.docs.map((doc) => doc.data() as PendingAssignment);
  }

  async createPending(pending: PendingAssignment) {
    await this.collection("pendingAssignments").doc(pending.id).set(pending);
    return pending;
  }

  async deletePending(id: string) {
    await this.collection("pendingAssignments").doc(id).delete();
  }

  async createInvite(invite: InviteRecord) {
    await this.collection("invites").doc(invite.id).set(invite);
    return invite;
  }

  async getInviteByToken(token: string) {
    const snap = await this.collection("invites").where("token", "==", token).limit(1).get();
    return (snap.docs[0]?.data() as InviteRecord | undefined) ?? null;
  }

  async findInviteByFrom(uid: string) {
    const snap = await this.collection("invites").where("fromUid", "==", uid).get();
    return (snap.docs.map((doc) => doc.data() as InviteRecord).find((invite) => !invite.boardId)) ?? null;
  }

  async findInviteByBoard(boardId: string) {
    const snap = await this.collection("invites").where("boardId", "==", boardId).limit(1).get();
    return (snap.docs[0]?.data() as InviteRecord | undefined) ?? null;
  }

  async updateInvite(id: string, patch: Partial<InviteRecord>) {
    const ref = this.collection("invites").doc(id);
    const current = (await ref.get()).data() as InviteRecord | undefined;
    if (!current) throw new Error("Invite missing.");
    const next = { ...current, ...patch, id: current.id, fromUid: current.fromUid };
    await ref.set(next);
    return next;
  }

  async saveOutbox(message: OutboxMessage) {
    await this.collection("mailOutbox").doc(message.id).set(message);
  }

  async savePushDevice(device: PushDevice) {
    await this.collection("pushDevices").doc(device.id).set(device);
  }

  async listPushDevices(uid: string) {
    const snap = await this.collection("pushDevices").where("uid", "==", uid).get();
    return snap.docs.map((doc) => doc.data() as PushDevice);
  }

  async deletePushDevice(id: string) {
    await this.collection("pushDevices").doc(id).delete();
  }
}
