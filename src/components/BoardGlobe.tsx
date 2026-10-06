"use client";

import createGlobe, { type Arc, type Marker } from "cobe";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Board, BoardPayload } from "@/lib/types";

type RGB = [number, number, number];
type Spot = { board: Board; lat: number; lon: number; rgb: RGB; open: number };
type Phase = "intro" | "idle" | "opening";

const RADIUS = 0.8;
const INTRO_MS = 2800;
const OPEN_MS = 900;
const SWIRL_COLOR: RGB = [0.45, 0.75, 1];

function hexToRgb(hex: string): RGB {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  const n = Number.parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function wrapLon(lon: number) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function placeSpots(boards: Board[], payload: BoardPayload): Spot[] {
  const count = boards.length;
  return boards.map((board, index) => {
    const cardIds = new Set(payload.cards.filter((card) => card.boardId === board.id).map((card) => card.id));
    const open = payload.dependencies.filter((item) => cardIds.has(item.cardId) && item.status !== "done").length;
    const band = count === 1 ? 0 : 1 - (2 * (index + 0.5)) / count;
    return {
      board,
      lat: (Math.asin(band * 0.7) * 180) / Math.PI,
      lon: wrapLon(20 + index * 137.508),
      rgb: hexToRgb(board.color),
      open,
    };
  });
}

// Mirrors cobe's own marker projection so HTML labels sit on the canvas markers.
function project(lat: number, lon: number, phi: number, theta: number, scale: number) {
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180 - Math.PI;
  const r = RADIUS + 0.05;
  const x = -Math.cos(latR) * Math.cos(lonR) * r;
  const y = Math.sin(latR) * r;
  const z = Math.cos(latR) * Math.sin(lonR) * r;
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const c = cp * x + sp * z;
  const s = sp * st * x + ct * y - cp * st * z;
  const depth = -sp * ct * x + st * y + cp * ct * z;
  return { x: (c * scale + 1) / 2, y: (-s * scale + 1) / 2, depth };
}

function facing(spot: Pick<Spot, "lat" | "lon">) {
  return { phi: 1.5 * Math.PI - (spot.lon * Math.PI) / 180, theta: (spot.lat * Math.PI) / 180 };
}

function nearestAngle(from: number, to: number) {
  const tau = Math.PI * 2;
  return to + Math.round((from - to) / tau) * tau;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function swirlArcs(progress: number): Arc[] {
  const strands = 3;
  const steps = 7;
  const fade = 1 - progress ** 2;
  const color: RGB = [SWIRL_COLOR[0] * fade, SWIRL_COLOR[1] * fade, SWIRL_COLOR[2] * fade];
  const arcs: Arc[] = [];
  for (let strand = 0; strand < strands; strand += 1) {
    const base = strand * 120 + progress * 540;
    for (let step = 0; step < steps; step += 1) {
      const a = step / steps;
      const b = (step + 1) / steps;
      arcs.push({
        from: [-60 + 120 * a, wrapLon(base + step * 48)],
        to: [-60 + 120 * b, wrapLon(base + (step + 1) * 48)],
        color,
      });
    }
  }
  return arcs;
}

function networkArcs(spots: Spot[], strength: number): Arc[] {
  if (spots.length < 2 || strength <= 0) return [];
  const pairs = spots.length === 2 ? [[0, 1]] : spots.map((_, i) => [i, (i + 1) % spots.length]);
  return pairs.map(([i, j]) => {
    const from = spots[i]!;
    const to = spots[j]!;
    return {
      from: [from.lat, from.lon],
      to: [to.lat, to.lon],
      color: from.rgb.map((v, k) => ((v + to.rgb[k]!) / 2) * strength) as RGB,
    };
  });
}

export function BoardGlobe({
  payload,
  onOpen,
  onSignOut,
}: {
  payload: BoardPayload;
  onOpen: (boardId: string) => void;
  onSignOut: () => void;
}) {
  const boards = useMemo(
    () => [...payload.boards].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [payload.boards],
  );
  const spots = useMemo(() => placeSpots(boards, payload), [boards, payload]);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [size, setSize] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [hint, setHint] = useState(false);

  const motion = useRef({
    phase: "intro" as Phase,
    start: 0,
    phi: 0,
    theta: 0.3,
    scale: 1,
    opacity: 1,
    velocity: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    moved: 0,
    hover: -1,
    from: { phi: 0, theta: 0 },
    to: { phi: 0, theta: 0 },
    target: "",
    dirty: true,
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      setSize(Math.max(240, Math.floor(Math.min(width, height, 720))));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const m = motion.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const home = facing(spots[0] ?? { lat: 0, lon: 0 });
    m.start = performance.now();
    m.to = home;
    if (reduced) {
      m.phase = "idle";
      m.phi = home.phi;
      m.theta = clamp(home.theta, -0.6, 0.6);
      setPhase("idle");
      setHint(true);
    } else {
      m.phase = "intro";
      m.from = { phi: home.phi - Math.PI * 5, theta: 1.05 };
    }
    // Run once per mount; later board edits only change markers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size === 0) return;
    const m = motion.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size,
      height: size,
      phi: m.phi,
      theta: m.theta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 5,
      baseColor: [0.22, 0.26, 0.36],
      markerColor: [0.4, 0.7, 1],
      glowColor: [0.16, 0.26, 0.55],
      markers: [],
      arcs: [],
      arcColor: SWIRL_COLOR,
      arcWidth: 0.6,
      arcHeight: 0.35,
      markerElevation: 0.02,
      scale: m.scale,
      opacity: m.opacity,
    });

    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      let swirl = 0;
      let reveal = 1;
      let markerGrow = 1;

      if (m.phase === "intro") {
        const t = clamp((now - m.start) / INTRO_MS, 0, 1);
        const e = easeOutCubic(t);
        m.phi = m.from.phi + (m.to.phi - m.from.phi) * e;
        m.theta = m.from.theta + (clamp(m.to.theta, -0.6, 0.6) - m.from.theta) * e;
        m.scale = 0.55 + 0.45 * e;
        swirl = t;
        reveal = clamp((t - 0.35) / 0.65, 0, 1);
        markerGrow = clamp((t - 0.25) / 0.6, 0, 1);
        m.dirty = true;
        if (t >= 1) {
          m.phase = "idle";
          setPhase("idle");
          setHint(true);
        }
      } else if (m.phase === "opening") {
        const t = clamp((now - m.start) / OPEN_MS, 0, 1);
        const e = easeInOutCubic(t);
        m.phi = m.from.phi + (m.to.phi - m.from.phi) * e;
        m.theta = m.from.theta + (m.to.theta - m.from.theta) * e;
        m.scale = 1 + 1.6 * easeInOutCubic(clamp((t - 0.35) / 0.65, 0, 1));
        m.opacity = 1 - clamp((t - 0.55) / 0.45, 0, 1);
        m.dirty = true;
        if (t >= 1 && m.target) {
          const id = m.target;
          m.target = "";
          onOpen(id);
        }
      } else if (!m.dragging && Math.abs(m.velocity) > 0.0001) {
        m.phi += m.velocity;
        m.velocity *= 0.92;
        m.dirty = true;
      }

      if (!m.dirty) return;
      m.dirty = m.phase !== "idle";

      const markers: Marker[] = spots.map((spot, index) => ({
        location: [spot.lat, spot.lon],
        size: (index === m.hover ? 0.1 : 0.065) * markerGrow,
        color: spot.rgb,
      }));
      const arcs = [...(swirl > 0 && swirl < 1 ? swirlArcs(swirl) : []), ...networkArcs(spots, reveal)];
      globe.update({ phi: m.phi, theta: m.theta, scale: m.scale, opacity: m.opacity, markers, arcs });

      spots.forEach((spot, index) => {
        const label = labelRefs.current[index];
        if (!label) return;
        const p = project(spot.lat, spot.lon, m.phi, m.theta, m.scale);
        const visible = clamp(p.depth * 4, 0, 1) * (m.phase === "intro" ? reveal ** 2 : 1) * m.opacity;
        label.style.left = `${p.x * 100}%`;
        label.style.top = `${p.y * 100}%`;
        label.style.opacity = String(visible);
        label.style.pointerEvents = visible > 0.4 && m.phase === "idle" ? "auto" : "none";
        label.style.zIndex = String(Math.round(p.depth * 100) + 100);
      });
    };
    frame = requestAnimationFrame(tick);
    m.dirty = true;

    return () => {
      cancelAnimationFrame(frame);
      globe.destroy();
    };
  }, [size, spots, onOpen]);

  function open(index: number) {
    const m = motion.current;
    const spot = spots[index];
    if (!spot || m.phase === "opening") return;
    const target = facing(spot);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onOpen(spot.board.id);
      return;
    }
    m.phase = "opening";
    m.start = performance.now();
    m.velocity = 0;
    m.from = { phi: m.phi, theta: m.theta };
    m.to = { phi: nearestAngle(m.phi, target.phi), theta: clamp(target.theta, -0.9, 0.9) };
    m.target = spot.board.id;
    setPhase("opening");
  }

  function onPointerDown(event: React.PointerEvent) {
    const m = motion.current;
    if (m.phase !== "idle") return;
    if ((event.target as Element).closest("button")) return;
    m.dragging = true;
    m.lastX = event.clientX;
    m.lastY = event.clientY;
    m.moved = 0;
    m.velocity = 0;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const m = motion.current;
    if (!m.dragging) return;
    const dx = event.clientX - m.lastX;
    const dy = event.clientY - m.lastY;
    m.lastX = event.clientX;
    m.lastY = event.clientY;
    m.moved += Math.abs(dx) + Math.abs(dy);
    const step = dx / (size * 0.45);
    m.phi += step;
    m.velocity = step;
    m.theta = clamp(m.theta + dy / (size * 0.6), -0.9, 0.9);
    m.dirty = true;
    if (hint) setHint(false);
  }

  function onPointerUp() {
    motion.current.dragging = false;
  }

  function hover(index: number) {
    motion.current.hover = index;
    motion.current.dirty = true;
  }

  const firstName = payload.user.name.split(" ")[0] || payload.user.name;

  return (
    <div className="globe-space relative flex h-screen min-h-0 flex-col overflow-hidden text-white">
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <p className="text-lg font-semibold tracking-tight">TaskOrbit</p>
          <p className="text-sm text-white/60">
            {phase === "intro" ? `Welcome back, ${firstName}` : "Spin the globe and pick a board"}
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
        className={`relative flex min-h-0 flex-1 items-center justify-center px-4 transition-opacity duration-500 ${
          phase === "opening" ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }`}
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            aria-hidden
            viewBox="-100 -100 200 200"
            className={`globe-orbits pointer-events-none absolute inset-[-12%] h-[124%] w-[124%] ${
              phase === "intro" ? "" : "globe-orbits-settled"
            }`}
          >
            <defs>
              <linearGradient id="orbit-a" x1="0" x2="1">
                <stop offset="0" stopColor="#7cc4ff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#7cc4ff" stopOpacity="0.9" />
                <stop offset="1" stopColor="#b79cff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="globe-orbit globe-orbit-1">
              <ellipse rx="92" ry="30" fill="none" stroke="url(#orbit-a)" strokeWidth="0.7" strokeDasharray="60 40 8 40" />
            </g>
            <g className="globe-orbit globe-orbit-2">
              <ellipse rx="86" ry="22" fill="none" stroke="url(#orbit-a)" strokeWidth="0.5" strokeDasharray="30 50 4 30" />
            </g>
            <g className="globe-orbit globe-orbit-3">
              <ellipse rx="96" ry="40" fill="none" stroke="url(#orbit-a)" strokeWidth="0.4" strokeDasharray="12 26" />
            </g>
          </svg>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ width: size, height: size }} />
          {spots.map((spot, index) => (
            <button
              key={spot.board.id}
              ref={(node) => {
                labelRefs.current[index] = node;
              }}
              type="button"
              className="absolute flex -translate-x-1/2 -translate-y-[135%] items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-[#0b1530]/80 px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg backdrop-blur transition-[transform,background-color] hover:scale-105 hover:bg-[#13224a]"
              style={{ pointerEvents: "none" }}
              onPointerEnter={() => hover(index)}
              onPointerLeave={() => hover(-1)}
              onClick={() => open(index)}
            >
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white/30" style={{ background: spot.board.color }} />
              {spot.board.name}
              <span className="text-xs text-white/55">{spot.open} open</span>
            </button>
          ))}
        </div>
        {hint ? (
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/45">
            Drag to spin · tap a board to open it
          </p>
        ) : null}
      </div>

      <nav
        aria-label="Boards"
        className={`relative z-10 flex flex-wrap justify-center gap-2 px-4 pb-6 pt-2 transition-opacity duration-500 ${
          phase === "intro" ? "opacity-0" : phase === "opening" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {spots.map((spot, index) => (
          <button
            key={spot.board.id}
            type="button"
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/85 transition hover:bg-white/20"
            onPointerEnter={() => hover(index)}
            onPointerLeave={() => hover(-1)}
            onFocus={() => hover(index)}
            onBlur={() => hover(-1)}
            onClick={() => open(index)}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: spot.board.color }} />
            {spot.board.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
