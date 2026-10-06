"use client";

import { useState } from "react";
import type { Dependency, Priority, Status } from "@/lib/types";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/types";
import { Field, Modal, fieldClass, ghostBtn, primaryBtn } from "./Modal";

type Assignee = { id: string; label: string };

const TYPED_OWNER = "__typed";

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DependencyDialog({
  cardName,
  dependency,
  siblings,
  focusHold = false,
  people,
  readOnly = false,
  onClose,
  onSubmit,
  onDelete,
}: {
  cardName: string;
  dependency?: Dependency;
  siblings: Dependency[];
  focusHold?: boolean;
  people: Assignee[];
  readOnly?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    startDate: string;
    deadline: string;
    dependantOnId: string | null;
    dependantOnLabel: string | null;
    status: Status;
    holdReason: string;
    assigneeMemberId: string | null;
    taskOwner: string;
    priority: Priority | "";
    waitingFor: string;
    blocks: string;
    nextAction: string;
    notes: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const initialMode = dependency?.dependantOnId ? "existing" : dependency?.dependantOnLabel ? "text" : "none";
  const [name, setName] = useState(dependency?.name ?? "");
  const typedOwner = (dependency && !dependency.assigneeMemberId ? dependency.taskOwner : null) ?? "";
  const [assignee, setAssignee] = useState(dependency?.assigneeMemberId ?? (typedOwner ? TYPED_OWNER : ""));
  const [startDate, setStartDate] = useState(dependency?.startDate ?? "");
  const [deadline, setDeadline] = useState(dependency?.deadline ?? "");
  const [mode, setMode] = useState<"none" | "existing" | "text">(initialMode);
  const [dependantOnId, setDependantOnId] = useState(dependency?.dependantOnId ?? "");
  const [dependantOnLabel, setDependantOnLabel] = useState(
    dependency?.dependantOnId ? "" : (dependency?.dependantOnLabel ?? ""),
  );
  const [status, setStatus] = useState<Status>(dependency?.status ?? (focusHold ? "hold" : "open"));
  const [priority, setPriority] = useState<Priority | "">(dependency?.priority ?? "");
  const [waitingFor, setWaitingFor] = useState(dependency?.waitingFor ?? "");
  const [blocks, setBlocks] = useState(dependency?.blocks ?? "");
  const [nextAction, setNextAction] = useState(dependency?.nextAction ?? "");
  const [notes, setNotes] = useState(dependency?.notes ?? "");
  const [holdReason, setHoldReason] = useState(dependency?.holdReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const choices = siblings.filter((item) => item.id !== dependency?.id);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name,
        startDate,
        deadline,
        dependantOnId: mode === "existing" ? dependantOnId : null,
        dependantOnLabel: mode === "text" ? dependantOnLabel : null,
        status,
        holdReason,
        assigneeMemberId: assignee && assignee !== TYPED_OWNER ? assignee : null,
        taskOwner: assignee === TYPED_OWNER ? typedOwner : "",
        priority,
        waitingFor,
        blocks,
        nextAction,
        notes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the task.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={readOnly ? "Task" : dependency ? "Edit task" : "Add task"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <p className="text-sm text-white/60">
          On {cardName}
          {readOnly ? " · view only. You can edit tasks you add or that are assigned to you." : ""}
        </p>
        {dependency ? (
          <p className="-mt-2 text-xs text-white/45">Last updated {formatUpdated(dependency.updatedAt)}</p>
        ) : null}
        <fieldset disabled={readOnly} className="m-0 grid min-w-0 gap-4 border-0 p-0 disabled:opacity-70">
          <Field label="Task">
            <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
          <Field label="Owner">
            <select className={fieldClass} value={assignee} onChange={(event) => setAssignee(event.target.value)}>
              <option value="">Unassigned</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.label}
                </option>
              ))}
              {typedOwner ? <option value={TYPED_OWNER}>{typedOwner}</option> : null}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Priority">
              <select className={fieldClass} value={priority} onChange={(event) => setPriority(event.target.value as Priority | "")}>
                <option value="">None</option>
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {PRIORITY_LABELS[item]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value as Status)}>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {STATUS_LABELS[item]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="From">
              <input
                className={fieldClass}
                type="date"
                value={startDate}
                max={deadline || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>
            <Field label="To">
              <input
                className={fieldClass}
                type="date"
                value={deadline}
                min={startDate || undefined}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Depends on">
            <select
              className={fieldClass}
              value={mode === "existing" ? dependantOnId : mode}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "none" || value === "text") {
                  setMode(value);
                  setDependantOnId("");
                  return;
                }
                setMode("existing");
                setDependantOnId(value);
              }}
            >
              <option value="none">Nothing</option>
              {choices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
              <option value="text">Something else…</option>
            </select>
          </Field>
          {mode === "text" ? (
            <Field label="What does it depend on?">
              <input className={fieldClass} value={dependantOnLabel} onChange={(event) => setDependantOnLabel(event.target.value)} />
            </Field>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Waiting for">
              <input className={fieldClass} value={waitingFor} onChange={(event) => setWaitingFor(event.target.value)} />
            </Field>
            <Field label="Blocks">
              <input className={fieldClass} value={blocks} onChange={(event) => setBlocks(event.target.value)} />
            </Field>
          </div>
          <Field label="Next action">
            <input className={fieldClass} value={nextAction} onChange={(event) => setNextAction(event.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className={fieldClass} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
          {status === "hold" ? (
            <Field label="Reason for hold">
              <textarea
                className={fieldClass}
                value={holdReason}
                required
                rows={3}
                autoFocus={focusHold}
                onChange={(event) => setHoldReason(event.target.value)}
              />
            </Field>
          ) : null}
        </fieldset>
        {error ? (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              type="button"
              className="text-sm font-medium text-clay"
              onClick={async () => {
                if (!window.confirm("Remove this task?")) return;
                setBusy(true);
                try {
                  await onDelete();
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not delete it.");
                  setBusy(false);
                }
              }}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className={ghostBtn} onClick={onClose}>
              {readOnly ? "Close" : "Cancel"}
            </button>
            {readOnly ? null : (
              <button className={primaryBtn} disabled={busy} type="submit">
                {busy ? "Saving…" : "Save task"}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
