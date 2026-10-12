"use client";

import { useState } from "react";
import { MAX_CHECKLIST, MAX_LABELS } from "@/lib/domain";
import { labelColor } from "@/lib/task-filters";
import type { ChecklistItem, Dependency, Priority, Status } from "@/lib/types";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/types";
import { Field, Modal, fieldClass, ghostBtn, primaryBtn } from "./Modal";
import { TaskThread } from "./TaskThread";

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
  labelSuggestions = [],
  currentUid,
  isBoardOwner = false,
  onThreadChanged,
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
  labelSuggestions?: string[];
  currentUid?: string;
  isBoardOwner?: boolean;
  onThreadChanged?: () => Promise<void>;
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
    labels: string[];
    checklist: ChecklistItem[];
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
  const [labels, setLabels] = useState<string[]>(dependency?.labels ?? []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(dependency?.checklist ?? []);
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
        labels,
        checklist,
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
          <LabelsField labels={labels} suggestions={labelSuggestions} onChange={setLabels} />
          <ChecklistField items={checklist} onChange={setChecklist} />
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
      {dependency && currentUid && onThreadChanged ? (
        <TaskThread dependencyId={dependency.id} currentUid={currentUid} isBoardOwner={isBoardOwner} onChanged={onThreadChanged} />
      ) : null}
    </Modal>
  );
}

function LabelsField({
  labels,
  suggestions,
  onChange,
}: {
  labels: string[];
  suggestions: string[];
  onChange: (labels: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const has = (label: string) => labels.some((item) => item.toLowerCase() === label.toLowerCase());
  const add = (value: string) => {
    const label = value.trim().replace(/\s+/g, " ").slice(0, 24);
    if (label && !has(label) && labels.length < MAX_LABELS) onChange([...labels, label]);
    setDraft("");
  };
  const unused = suggestions.filter((label) => !has(label));
  return (
    <div className="text-sm font-medium text-white/75">
      <label htmlFor="task-label-input">Labels</label>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5">
        {labels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ background: `${labelColor(label)}33`, boxShadow: `inset 0 0 0 1px ${labelColor(label)}88` }}
          >
            {label}
            <button
              type="button"
              aria-label={`Remove label ${label}`}
              className="text-white/60 hover:text-white"
              onClick={() => onChange(labels.filter((item) => item !== label))}
            >
              ×
            </button>
          </span>
        ))}
        {labels.length < MAX_LABELS ? (
          <input
            id="task-label-input"
            className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-white outline-none placeholder:text-white/35"
            placeholder={labels.length ? "Add another" : "Type a label and press Enter"}
            value={draft}
            list="task-label-suggestions"
            maxLength={24}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => add(draft)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                add(draft);
              } else if (event.key === "Backspace" && !draft && labels.length) {
                onChange(labels.slice(0, -1));
              }
            }}
          />
        ) : null}
        <datalist id="task-label-suggestions">
          {unused.map((label) => (
            <option key={label} value={label} />
          ))}
        </datalist>
      </div>
      {unused.length && labels.length < MAX_LABELS ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {unused.slice(0, 8).map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-dashed border-white/20 px-2 py-0.5 text-xs text-white/60 hover:border-white/40 hover:text-white"
              onClick={() => add(label)}
            >
              + {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChecklistField({ items, onChange }: { items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void }) {
  const [draft, setDraft] = useState("");
  const done = items.filter((item) => item.done).length;
  const add = () => {
    const text = draft.trim();
    if (!text || items.length >= MAX_CHECKLIST) return;
    onChange([...items, { id: crypto.randomUUID(), text: text.slice(0, 140), done: false }]);
    setDraft("");
  };
  const update = (id: string, patch: Partial<ChecklistItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <div className="text-sm font-medium text-white/75">
      <div className="flex items-center justify-between">
        <span>Checklist</span>
        {items.length ? (
          <span className="text-xs font-normal text-white/50">
            {done}/{items.length} done
          </span>
        ) : null}
      </div>
      {items.length ? (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#22b07d] transition-[width]" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      ) : null}
      <ul className="mt-2 grid gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              aria-label={`Done: ${item.text}`}
              className="h-4 w-4 shrink-0 accent-[#22b07d]"
              checked={item.done}
              onChange={(event) => update(item.id, { done: event.target.checked })}
            />
            <input
              aria-label="Checklist item"
              className={`min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm outline-none focus:bg-white/5 ${
                item.done ? "text-white/40 line-through" : "text-white"
              }`}
              value={item.text}
              maxLength={140}
              onChange={(event) => update(item.id, { text: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
            <button
              type="button"
              aria-label={`Remove ${item.text}`}
              className="rounded px-1.5 text-white/40 hover:bg-white/10 hover:text-white"
              onClick={() => onChange(items.filter((other) => other.id !== item.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {items.length < MAX_CHECKLIST ? (
        <input
          aria-label="Add a checklist item"
          className={`${fieldClass} mt-1.5`}
          placeholder="Add an item and press Enter"
          value={draft}
          maxLength={140}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={add}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
      ) : null}
    </div>
  );
}
