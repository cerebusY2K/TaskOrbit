import { afterAll, describe, expect, it } from "vitest";
import { BoardService } from "./board-service";
import { FirestoreStore, getAdminApp } from "./firestore-store";
import type { SessionUser } from "./types";
import { getFirestore } from "firebase-admin/firestore";

const enabled = process.env.FIRESTORE_SMOKE === "1";
const run = `smoke-${Date.now()}`;
const ada: SessionUser = { uid: `${run}-ada`, email: `${run}-ada@example.com`, name: "Ada", photoURL: null };
const sam: SessionUser = { uid: `${run}-sam`, email: `${run}-sam@example.com`, name: "Sam", photoURL: null };

describe.skipIf(!enabled)("Firestore store against the live database", () => {
  const service = new BoardService(new FirestoreStore(), "https://taskorb.example");

  afterAll(async () => {
    const db = getFirestore(getAdminApp());
    const owned = ["boards", "cards", "dependencies"];
    for (const name of owned) {
      for (const uid of [ada.uid, sam.uid]) {
        const snap = await db.collection(name).where("ownerId", "==", uid).get();
        await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
      }
    }
    for (const uid of [ada.uid, sam.uid]) {
      const notes = await db.collection("notifications").where("userId", "==", uid).get();
      await Promise.all(notes.docs.map((doc) => doc.ref.delete()));
      const invites = await db.collection("invites").where("fromUid", "==", uid).get();
      await Promise.all(invites.docs.map((doc) => doc.ref.delete()));
      await db.collection("users").doc(uid).delete();
    }
  });

  it("runs a full board, task, move, and invite flow", async () => {
    await service.signIn(ada);
    await service.signIn(sam);

    const start = await service.board(ada);
    expect(start.boards).toHaveLength(1);
    expect(start.cards.filter((card) => card.isSelf)).toHaveLength(1);

    const launch = await service.createBoard(ada, { name: "Launch", color: "#6554c0" });
    const updated = await service.updateBoard(ada, launch.id, { color: "#00875a" });
    expect(updated.color).toBe("#00875a");

    const api = await service.createCard(ada, { name: "API", color: "#c4553a", boardId: launch.id });
    const qa = await service.createCard(ada, { name: "QA", color: "#0c66e4", boardId: launch.id });
    const created = await service.createDependency(ada, {
      cardId: api.id,
      name: "Implement EKYC document upload",
      status: "wip",
      taskOwner: "Rahul",
      priority: "high",
      deadline: "2026-10-08",
      dependantOnLabel: "API changes",
      waitingFor: "Backend team",
      blocks: "QA testing",
      nextAction: "Backend needs to deploy API",
      lastUpdate: "2026-10-05",
      notes: "iOS implementation pending",
    });
    await service.updateDependency(ada, created.dependency.id, { status: "hold", holdReason: "Waiting on API" });
    const moved = await service.moveDependency(ada, created.dependency.id, qa.id);
    expect(moved.cardId).toBe(qa.id);

    const loaded = await service.board(ada);
    const task = loaded.dependencies.find((item) => item.id === created.dependency.id);
    expect(task?.taskOwner).toBe("Rahul");
    expect(task?.status).toBe("hold");
    expect(task?.notes).toBe("iOS implementation pending");
    expect(loaded.cards.find((card) => card.id === api.id)?.boardId).toBe(launch.id);

    const other = await service.board(sam);
    expect(other.cards.some((card) => card.id === api.id)).toBe(false);
    expect(other.dependencies).toHaveLength(0);

    const invite = await service.inviteLink(ada, "https://taskorb.example");
    const accepted = await service.acceptInvite(sam, invite.token);
    expect(accepted.status).toBe("accepted");

    await service.deleteBoard(ada, launch.id);
    const after = await service.board(ada);
    expect(after.boards).toHaveLength(1);
    expect(after.dependencies.some((item) => item.id === created.dependency.id)).toBe(false);
  }, 60_000);
});
