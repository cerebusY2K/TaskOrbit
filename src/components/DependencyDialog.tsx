"use client";

import { useState } from "react";
import type { Dependency, Priority, Status } from "@/lib/types";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/types";
import { Field, Modal, fieldClass, ghostBtn, primaryBtn } from "./Modal";

export function DependencyDialog({
  cardName,
  dependency,
  siblings,
  focusHold = false,
  onClose,
  onSubmit,
  onDelete,
}: {
  cardName: string;
  dependency?: Dependency;
  siblings: Dependency[];
  focusHold?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    deadline: string;
    dependantOnId: string | null;
    dependantOnLabel: string | null;
    status: Status;
    holdReason: string;
    taskOwner: string;
    priority: Priority | "";
    waitingFor: string;
    blocks: string;
    nextAction: string;
    lastUpdate: string;
    notes: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const initialMode = dependency?.dependantOnId ? "existing" : dependency?.dependantOnLabel ? "text" : "none";
  const [name, setName] = useState(dependency?.name ?? "");
  const [taskOwner, setTaskOwner] = useState(dependency?.taskOwner ?? "");
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
  const [lastUpdate, setLastUpdate] = useState(dependency?.lastUpdate ?? "");
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
        deadline,
        dependantOnId: mode === "existing" ? dependantOnId : null,
        dependantOnLabel: mode === "text" ? dependantOnLabel : null,
        status,
        holdReason,
        taskOwner,
        priority,
        waitingFor,
        blocks,
        nextAction,
        lastUpdate,
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
    <Modal title={dependency ? "Edit task" : "Add task"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <p className="text-sm text-white/60">On {cardName}</p>
        <Field label="Task">
          <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner">
            <input className={fieldClass} value={taskOwner} onChange={(event) => setTaskOwner(event.target.value)} />
          </Field>
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
          <Field label="Due date">
            <input className={fieldClass} type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
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
        <Field label="Last update">
          <input className={fieldClass} type="date" value={lastUpdate} onChange={(event) => setLastUpdate(event.target.value)} />
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
              Cancel
            </button>
            <button className={primaryBtn} disabled={busy} type="submit">
              {busy ? "Saving…" : "Save task"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
