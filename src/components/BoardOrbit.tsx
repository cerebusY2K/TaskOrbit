"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isOverdue, todayISO } from "@/lib/domain";
import type { Board, BoardPayload, Dependency } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

type Item = { board: Board; ring: number; offset: number; open: number; overdue: number; tasks: Dependency[] };

const INTRO_MS = 1800;
const OPEN_MS = 420;
const LAP_MS = 42000;
const SLOW = 0.04;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function buildItems(payload: BoardPayload): Item[] {
  const boards = [...payload.boards].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rings = boards.length <= 3 ? 1 : boards.length <= 7 ? 2 : 3;
  const today = todayISO();
  return boards.map((board, index) => {
    const ring = index % rings;
    const onRing = boards.filter((_, i) => i % rings === ring).length;
    const slot = Math.floor(index / rings);
    const cardIds = new Set(payload.cards.filter((card) => card.boardId === board.id).map((card) => card.id));
    const tasks = payload.dependencies.filter((item) => cardIds.has(item.cardId) && item.status !== "done");
    return {
      board,
      ring,
      offset: (slot / onRing) * Math.PI * 2 + ring * 0.9,
      open: tasks.length,
      overdue: tasks.filter((item) => isOverdue(item.deadline, item.status, today)).length,
      tasks: tasks.slice(0, 3),
    };
  });
}

export function BoardOrbit({
  payload,
  onOpen,
  onSignOut,
}: {
  payload: BoardPayload;
  onOpen: (boardId: string) => void;
  onSignOut: () => void;
}) {
  const items = useMemo(() => buildItems(payload), [payload]);
  const rings = Math.max(1, ...items.map((item) => item.ring + 1));
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState(-1);
  const [opening, setOpening] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const live = useRef({ hovered: -1, angles: [] as number[], speeds: [] as number[], scales: [] as number[] });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      setBox({ width, height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  function ringSize(ring: number) {
    const { width, height } = box;
    const k = rings === 1 ? 1 : 0.55 + (0.45 * ring) / (rings - 1);
    const portrait = height > width;
    const rx = clamp(width / 2 - (portrait ? 75 : 110), 60, 620) * k;
    const ry = Math.min(Math.max(50, height / 2 - 80) * k, rx * (portrait ? 2.6 : 0.42));
    return { rx, ry };
  }

  useEffect(() => {
    if (box.width === 0) return;
    const state = live.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    items.forEach((item, index) => {
      state.angles[index] ??= item.offset;
      state.speeds[index] ??= 1;
      state.scales[index] ??= 1;
    });
    const start = performance.now();
    let last = start;
    let frame = 0;
    let done = false;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(64, now - last);
      last = now;
      const intro = reduced ? 1 : clamp((now - start) / INTRO_MS, 0, 1);
      const grow = easeOutCubic(intro);
      if (intro >= 1 && !done) {
        done = true;
        setSettled(true);
      }

      items.forEach((item, index) => {
        const card = cardRefs.current[index];
        if (!card) return;
        const focus = state.hovered;
        const targetSpeed = reduced ? 0 : focus === -1 ? 1 : focus === index ? 0 : SLOW;
        const targetScale = focus === index ? 1.14 : 1;
        state.speeds[index]! += (targetSpeed - state.speeds[index]!) * Math.min(1, dt / 220);
        state.scales[index]! += (targetScale - state.scales[index]!) * Math.min(1, dt / 140);
        const lap = LAP_MS * (1 + item.ring * 0.45);
        state.angles[index]! += ((Math.PI * 2) / lap) * dt * state.speeds[index]!;

        const { rx, ry } = ringSize(item.ring);
        const spin = (1 - grow) * Math.PI * 2.4;
        const angle = state.angles[index]! - spin;
        const x = Math.cos(angle) * rx * grow;
        const y = Math.sin(angle) * ry * grow;
        const depth = (Math.sin(angle) + 1) / 2;
        const scale = (0.78 + 0.22 * depth) * state.scales[index]! * (0.4 + 0.6 * grow);
        const fade = focus !== -1 && focus !== index ? 0.55 : 1;
        card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
        card.style.opacity = String((0.5 + 0.5 * depth) * fade * clamp(intro * 2, 0, 1));
        card.style.zIndex = String(focus === index ? 1000 : Math.round(depth * 100));
      });
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // ringSize reads box/rings, both covered here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box, items]);

  function focus(index: number) {
    live.current.hovered = index;
    setHovered(index);
  }

  function open(item: Item) {
    if (opening) return;
    focus(items.indexOf(item));
    setOpening(item.board.id);
    window.setTimeout(() => onOpen(item.board.id), OPEN_MS);
  }

  const firstName = payload.user.name.split(" ")[0] || payload.user.name;
  const today = todayISO();

  return (
    <div className="orbit-space relative flex h-screen min-h-0 flex-col overflow-hidden text-white">
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <p className="text-lg font-semibold tracking-tight">TaskOrbit</p>
          <p className="text-sm text-white/60">
            {settled ? "Hover a board to pause it, click to open" : `Welcome back, ${firstName}`}
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </header>

      <div
        ref={stageRef}
        className={`relative min-h-0 flex-1 transition-opacity duration-300 ${opening ? "opacity-0 delay-200" : ""}`}
      >
        {box.width > 0 ? (
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
            {Array.from({ length: rings }, (_, ring) => {
              const { rx, ry } = ringSize(ring);
              return (
                <ellipse
                  key={ring}
                  cx={box.width / 2}
                  cy={box.height / 2}
                  rx={rx}
                  ry={ry}
                  fill="none"
                  stroke="rgba(150, 190, 255, 0.24)"
                  strokeDasharray="2 6"
                />
              );
            })}
          </svg>
        ) : null}

        <div className="orbit-core pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" />

        <div className="absolute left-1/2 top-1/2">
          {items.map((item, index) => {
            const isHovered = hovered === index;
            return (
              <button
                key={item.board.id}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                type="button"
                className="absolute left-0 top-0 w-max max-w-[18rem] rounded-xl border border-white/10 bg-[#0d1733]/85 px-3 py-2 sm:px-4 sm:py-2.5 text-left shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{ opacity: 0, boxShadow: isHovered ? `0 0 0 1px ${item.board.color}, 0 14px 50px rgba(0,0,0,0.55)` : undefined }}
                onPointerEnter={() => focus(index)}
                onPointerLeave={() => !opening && focus(-1)}
                onFocus={() => focus(index)}
                onBlur={() => !opening && focus(-1)}
                onClick={() => open(item)}
              >
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white/25" style={{ background: item.board.color }} />
                  <span className="truncate text-sm font-semibold sm:text-base">{item.board.name}</span>
                </span>
                <span className="mt-0.5 block text-xs text-white/55 sm:text-sm">
                  {item.open} open{item.overdue ? ` · ${item.overdue} overdue` : ""}
                </span>
                {isHovered && item.tasks.length ? (
                  <ul className="mt-2 grid gap-1 border-t border-white/10 pt-2">
                    {item.tasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between gap-3 text-sm">
                        <span
                          className={`truncate ${isOverdue(task.deadline, task.status, today) ? "text-[#ff9b85]" : "text-white/85"}`}
                        >
                          {task.name}
                        </span>
                        <span className="shrink-0 text-white/45">{STATUS_LABELS[task.status]}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <nav
        aria-label="Boards"
        className={`relative z-10 flex flex-wrap justify-center gap-2 px-4 pb-6 pt-2 transition-opacity duration-500 ${
          settled && !opening ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {items.map((item) => (
          <button
            key={item.board.id}
            type="button"
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/85 transition hover:bg-white/20"
            onClick={() => open(item)}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: item.board.color }} />
            {item.board.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
