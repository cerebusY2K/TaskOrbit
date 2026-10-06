export type Orbit = { rx: number; ry: number; tilt: number };

export const TILTS = [-10, 16, -22, 6, 26, -16, 20, -4, 12, -26];
export const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const TAIL_STEPS = 28;

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function toRgb(hex: string) {
  const value = Number.parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return Number.isNaN(value) ? "120, 170, 255" : `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

export function tiltFor(index: number) {
  return (TILTS[index % TILTS.length]! * Math.PI) / 180;
}

export function pointOn(orbit: Orbit, angle: number, grow = 1) {
  const ex = Math.cos(angle) * orbit.rx * grow;
  const ey = Math.sin(angle) * orbit.ry * grow;
  const cos = Math.cos(orbit.tilt);
  const sin = Math.sin(orbit.tilt);
  return { x: ex * cos - ey * sin, y: ex * sin + ey * cos, depth: (Math.sin(angle) + 1) / 2 };
}

export function drawTail(
  ctx: CanvasRenderingContext2D,
  options: { cx: number; cy: number; orbit: Orbit; angle: number; length: number; grow?: number; rgb: string; alpha: number; width: number },
) {
  const { cx, cy, orbit, angle, length, grow = 1, rgb, alpha, width } = options;
  ctx.lineCap = "butt";
  ctx.shadowBlur = 12;
  ctx.shadowColor = `rgba(${rgb}, ${0.7 * alpha})`;
  let prev = pointOn(orbit, angle, grow);
  for (let step = 1; step <= TAIL_STEPS; step++) {
    const t = step / TAIL_STEPS;
    const point = pointOn(orbit, angle - length * t, grow);
    ctx.strokeStyle = `rgba(${rgb}, ${(1 - t) ** 1.4 * 0.9 * alpha * (0.55 + 0.45 * point.depth)})`;
    ctx.lineWidth = Math.max(0.5, width * (1 - t) * (0.7 + 0.3 * point.depth));
    ctx.beginPath();
    ctx.moveTo(cx + prev.x, cy + prev.y);
    ctx.lineTo(cx + point.x, cy + point.y);
    ctx.stroke();
    prev = point;
  }
}

export function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
