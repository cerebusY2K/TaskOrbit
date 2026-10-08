"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Board, BoardMember, EmailStatus, UserProfile } from "@/lib/types";
import { Field, Modal, fieldClass, ghostBtn, primaryBtn } from "./Modal";

export function MembersDialog({
  board,
  user,
  onClose,
  onChanged,
  onLeft,
}: {
  board: Board;
  user: UserProfile;
  onClose: () => void;
  onChanged: (message: string) => Promise<void>;
  onLeft: () => Promise<void>;
}) {
  const isOwner = board.ownerId === user.uid;
  const members = board.members ?? [];
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOwner) return;
    api<{ url: string }>(`/api/boards/${board.id}/invite`, { method: "POST" })
      .then((result) => setUrl(result.url))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not create the invite link."));
  }, [board.id, isOwner]);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const message = await action();
      setNotice(message);
      await onChanged(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function merge(from: BoardMember, intoId: string) {
    const into = members.find((member) => member.id === intoId);
    if (!into) return;
    const ok = window.confirm(
      `Merge ${from.name} (${from.email}) into ${into.name} (${into.email})?\n\nTheir tasks on ${board.name} move to ${into.email}, and ${from.email} is removed from the board.`,
    );
    if (!ok) return;
    void run(async () => {
      const result = await api<{ moved: number }>(`/api/boards/${board.id}/members/merge`, {
        method: "POST",
        body: JSON.stringify({ fromId: from.id, intoId: into.id }),
      });
      return `Merged into ${into.name}. ${result.moved} task${result.moved === 1 ? "" : "s"} moved.`;
    });
  }

  const waiting = members.some((member) => !member.uid);
  const joined = members.some((member) => member.uid);

  return (
    <Modal title={`${board.name} members`} onClose={onClose}>
      <div className="grid gap-5">
        {isOwner ? (
          <section className="grid gap-2">
            <p className="text-sm text-white/60">
              Anyone who opens this link and signs in with Google joins {board.name}. They see the whole board and can edit
              tasks they add or that are assigned to them.
            </p>
            <div className="flex gap-2">
              <input
                aria-label="Board invite link"
                className={`${fieldClass} mt-0`}
                readOnly
                value={url ?? ""}
                placeholder="Creating your link…"
                onFocus={(event) => event.currentTarget.select()}
              />
              <button
                type="button"
                className={primaryBtn}
                disabled={!url}
                onClick={async () => {
                  if (!url) return;
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid gap-2">
          <h3 className="text-sm font-semibold text-white/80">People</h3>
          {isOwner && waiting && joined ? (
            <p className="rounded-lg border border-[#4d84ff]/40 bg-[#4d84ff]/10 px-3 py-2 text-xs text-white/75">
              Someone joined with a different email? Use “Merge into” on their old entry. Its tasks move to the account they
              signed in with, and the old email goes away.
            </p>
          ) : null}
          <ul className="grid gap-2">
            <MemberRow name={board.ownerName ?? user.name} email={null} badge="Owner" you={isOwner} />
            {members.map((member) => (
              <MemberRow
                key={member.id}
                name={member.name}
                email={member.email}
                badge={member.uid ? "Joined" : "Not joined yet"}
                joined={Boolean(member.uid)}
                you={member.uid === user.uid}
              >
                {isOwner ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {!member.uid ? (
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-xs font-medium text-[#9dbcff] hover:bg-white/10"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const result = await api<{ emailStatus: EmailStatus }>(
                              `/api/boards/${board.id}/members/${member.id}/invite`,
                              { method: "POST" },
                            );
                            return inviteMessage(member.name, member.email, result.emailStatus, "resent");
                          })
                        }
                      >
                        Resend invite
                      </button>
                    ) : null}
                    {members.length > 1 ? (
                      <select
                        aria-label={`Merge ${member.name} into another member`}
                        className="rounded-md border border-white/15 bg-[#0b1430] px-2 py-1 text-xs text-white/85"
                        value=""
                        disabled={busy}
                        onChange={(event) => merge(member, event.target.value)}
                      >
                        <option value="">Merge into…</option>
                        {members
                          .filter((other) => other.id !== member.id)
                          .map((other) => (
                            <option key={other.id} value={other.id}>
                              {other.name} · {other.email}
                            </option>
                          ))}
                      </select>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs font-medium text-clay hover:bg-white/10"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(`Remove ${member.name} from ${board.name}? Their tasks stay, unassigned.`)) return;
                        void run(async () => {
                          await api(`/api/boards/${board.id}/members/${member.id}`, { method: "DELETE" });
                          return `${member.name} removed.`;
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </MemberRow>
            ))}
          </ul>
        </section>

        {isOwner ? (
          <form
            className="grid gap-3 border-t border-white/10 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const result = await api<{ emailStatus: EmailStatus }>(`/api/boards/${board.id}/members`, {
                  method: "POST",
                  body: JSON.stringify({ name, email }),
                });
                setName("");
                setEmail("");
                return inviteMessage(name.trim(), email.trim(), result.emailStatus, "added");
              });
            }}
          >
            <div>
              <h3 className="text-sm font-semibold text-white/80">Invite by email</h3>
              <p className="mt-1 text-xs text-white/50">They get an email with a link to {board.name}. Assign them tasks from the Owner field.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
              </Field>
              <Field label="Email">
                <input
                  className={fieldClass}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button type="submit" className={primaryBtn} disabled={busy}>
                Add and email invite
              </button>
            </div>
          </form>
        ) : null}

        {notice ? <p className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80">{notice}</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          {!isOwner ? (
            <button
              type="button"
              className="text-sm font-medium text-clay"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm(`Leave ${board.name}? You can rejoin with the invite link.`)) return;
                setBusy(true);
                try {
                  await api(`/api/boards/${board.id}/leave`, { method: "POST" });
                  await onLeft();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not leave the board.");
                  setBusy(false);
                }
              }}
            >
              Leave board
            </button>
          ) : (
            <span />
          )}
          <button type="button" className={ghostBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

function inviteMessage(name: string, email: string, status: EmailStatus, action: "added" | "resent") {
  if (status === "sent") return action === "added" ? `${name} added. Invite emailed to ${email}.` : `Invite sent again to ${email}.`;
  const problem =
    status === "failed"
      ? `the email to ${email} did not go through. Copy the link above and send it to them.`
      : `email is not set up yet. Copy the link above and send it to ${email}.`;
  return action === "added" ? `${name} added, but ${problem}` : problem.charAt(0).toUpperCase() + problem.slice(1);
}

function MemberRow({
  name,
  email,
  badge,
  joined = true,
  you,
  children,
}: {
  name: string;
  email: string | null;
  badge: string;
  joined?: boolean;
  you: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {name}
            {you ? <span className="ml-1.5 text-xs font-normal text-white/50">(you)</span> : null}
          </p>
          {email ? <p className="truncate text-xs text-white/50">{email}</p> : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            joined ? "bg-[#22b07d]/15 text-[#7be0b5]" : "bg-white/10 text-white/50"
          }`}
        >
          {badge}
        </span>
      </div>
      {children ? <div className="mt-2 pl-11">{children}</div> : null}
    </li>
  );
}
