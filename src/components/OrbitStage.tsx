"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clamp, drawTail, easeOutCubic, GOLDEN, pointOn, setupCanvas, tiltFor, toRgb } from "./orbit-math";

export type OrbitEntry = { key: string; color: string };

const INTRO_MS = 1800;
const OPEN_MS = 420;
const LAP_MS = 42000;
const SLOW = 0.04;
const TAIL = 1.1;

export function OrbitStage({
  entries,
  renderItem,
  onOpen,
  fadeOnOpen = false,
  center,
  onSettled,
  className = "",
}: {
  entries: OrbitEntry[];
  renderItem: (index: number, hovered: boolean) => ReactNode;
  onOpen: (index: number) => void;
  fadeOnOpen?: boolean;
  center?: ReactNode;
  onSettled?: () => void;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState(-1);
  const [opening, setOpening] = useState(false);
  const live = useRef({ hovered: -1, angles: [] as number[], speeds: [] as number[], scales: [] as number[] });
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  const count = entries.length;
  const reachOf = (index: number) => (count === 1 ? 0.7 : 0.38 + (0.62 * index) / (count - 1));

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

  function orbitOf(index: number) {
    const { width, height } = box;
    const portrait = height > width;
    const reach = reachOf(index);
    const tilt = tiltFor(index);
    const rx = clamp(width / 2 - (portrait ? 75 : 110), 60, 620) * reach;
    const ry = Math.min(Math.max(50, height / 2 - 80) * reach, rx * (portrait ? 2.6 : 0.42));
    return { rx, ry, tilt: portrait ? tilt * 0.4 : tilt };
  }

  const colors = entries.map((entry) => entry.color).join("|");

  useEffect(() => {
    if (box.width === 0 || !canvasRef.current) return;
    const ctx = setupCanvas(canvasRef.current, box.width, box.height);
    if (!ctx) return;
    const cx = box.width / 2;
    const cy = box.height / 2;
    const state = live.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rgbs = entries.map((entry) => toRgb(entry.color));
    entries.forEach((_, index) => {
      state.angles[index] ??= index * GOLDEN;
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
        settledRef.current?.();
      }

      ctx.clearRect(0, 0, box.width, box.height);
      const appear = clamp(intro * 2, 0, 1);

      entries.forEach((_, index) => {
        const item = itemRefs.current[index];
        if (!item) return;
        const reach = reachOf(index);
        const lap = LAP_MS * (0.45 + reach);
        const focus = state.hovered;
        const targetSpeed = reduced ? 0 : focus === -1 ? 1 : focus === index ? 0 : SLOW;
        const targetScale = focus === index ? 1.14 : 1;
        state.speeds[index]! += (targetSpeed - state.speeds[index]!) * Math.min(1, dt / 220);
        state.scales[index]! += (targetScale - state.scales[index]!) * Math.min(1, dt / 140);
        state.angles[index]! += ((Math.PI * 2) / lap) * dt * state.speeds[index]!;

        const orbit = orbitOf(index);
        const spin = (1 - grow) * Math.PI * 2.4;
        const angle = state.angles[index]! - spin;
        const { x, y, depth } = pointOn(orbit, angle, grow);
        const scale = (0.78 + 0.22 * depth) * state.scales[index]! * (0.4 + 0.6 * grow);
        const fade = focus !== -1 && focus !== index ? 0.55 : 1;
        item.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
        item.style.opacity = String((0.5 + 0.5 * depth) * fade * appear);
        item.style.zIndex = String(focus === index ? 1000 : Math.round(depth * 100));

        const motion = reduced ? 0.35 : 0.2 + 0.8 * Math.min(1, state.speeds[index]!) + (1 - grow) * 1.6;
        drawTail(ctx, {
          cx,
          cy,
          orbit,
          angle,
          grow,
          length: TAIL * motion,
          rgb: rgbs[index]!,
          alpha: fade * appear,
          width: 8,
        });
      });
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // entries are tracked through count and colors; orbitOf reads box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box, count, colors]);

  function focus(index: number) {
    live.current.hovered = index;
    setHovered(index);
  }

  function open(index: number) {
    if (opening) return;
    if (!fadeOnOpen) {
      onOpen(index);
      return;
    }
    focus(index);
    setOpening(true);
    window.setTimeout(() => onOpen(index), OPEN_MS);
  }

  return (
    <div
      ref={stageRef}
      className={`relative isolate min-h-0 flex-1 overflow-hidden transition-opacity duration-300 ${opening ? "opacity-0 delay-200" : ""} ${className}`}
    >
      {box.width > 0 ? (
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
          {entries.map((entry, index) => {
            const { rx, ry, tilt } = orbitOf(index);
            const dim = hovered !== -1 && hovered !== index;
            return (
              <ellipse
                key={entry.key}
                cx={box.width / 2}
                cy={box.height / 2}
                rx={rx}
                ry={ry}
                transform={`rotate(${(tilt * 180) / Math.PI} ${box.width / 2} ${box.height / 2})`}
                fill="none"
                stroke={entry.color}
                strokeOpacity={dim ? 0.08 : hovered === index ? 0.45 : 0.2}
                strokeDasharray="2 6"
                className="transition-[stroke-opacity] duration-300"
              />
            );
          })}
        </svg>
      ) : null}

      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="orbit-core pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      {center ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 translate-y-6 text-center">
          {center}
        </div>
      ) : null}

      <div className="absolute left-1/2 top-1/2">
        {entries.map((entry, index) => (
          <button
            key={entry.key}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            className="absolute left-0 top-0 w-max max-w-[18rem] rounded-xl border border-white/10 bg-[#0d1733]/85 px-3 py-2 text-left shadow-[0_10px_40px_rgba(0,0,0,0.45)] outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-white/70 sm:px-4 sm:py-2.5"
            style={{
              opacity: 0,
              boxShadow: hovered === index ? `0 0 0 1px ${entry.color}, 0 14px 50px rgba(0,0,0,0.55)` : undefined,
            }}
            onPointerEnter={() => focus(index)}
            onPointerLeave={() => !opening && focus(-1)}
            onFocus={() => focus(index)}
            onBlur={() => !opening && focus(-1)}
            onClick={() => open(index)}
          >
            {renderItem(index, hovered === index)}
          </button>
        ))}
      </div>
    </div>
  );
}
