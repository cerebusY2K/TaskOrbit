"use client";

import { useEffect, useRef } from "react";
import { clamp, drawTail, easeOutCubic, GOLDEN, pointOn, setupCanvas, tiltFor, toRgb, type Orbit } from "./orbit-math";

const COMETS = ["#4c7dff", "#22b07d", "#a970ff", "#ff9f43", "#ff5c8a"];
const INTRO_MS = 2200;

export function OrbitBackdrop({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const comets = COMETS.map((color, index) => ({
      rgb: toRgb(color),
      reach: 0.4 + (0.6 * index) / (COMETS.length - 1),
      tilt: tiltFor(index),
      angle: index * GOLDEN,
    }));
    let width = 0;
    let height = 0;
    let ctx: CanvasRenderingContext2D | null = null;
    const observer = new ResizeObserver(([entry]) => {
      width = entry!.contentRect.width;
      height = entry!.contentRect.height;
      ctx = setupCanvas(canvas, width, height);
    });
    observer.observe(canvas);

    const orbitOf = (reach: number, tilt: number): Orbit => {
      const portrait = height > width;
      const rx = clamp(width / 2 - (portrait ? 30 : 80), 80, 720) * reach;
      const ry = Math.min((height / 2 - 40) * reach, rx * (portrait ? 2.2 : 0.42));
      return { rx, ry, tilt: portrait ? tilt * 0.4 : tilt };
    };

    const start = performance.now();
    let last = start;
    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(64, now - last);
      last = now;
      if (!ctx || width === 0) return;
      const intro = reduced ? 1 : clamp((now - start) / INTRO_MS, 0, 1);
      const grow = easeOutCubic(intro);
      const cx = width / 2;
      const cy = height / 2;
      ctx.clearRect(0, 0, width, height);

      comets.forEach((comet, index) => {
        if (!reduced) comet.angle += ((Math.PI * 2) / (30000 * (0.5 + comet.reach))) * dt;
        const orbit = orbitOf(comet.reach, comet.tilt);
        const angle = comet.angle - (1 - grow) * Math.PI * 2;

        ctx!.save();
        ctx!.translate(cx, cy);
        ctx!.rotate(orbit.tilt);
        ctx!.setLineDash([2, 6]);
        ctx!.shadowBlur = 0;
        ctx!.strokeStyle = `rgba(${comet.rgb}, ${0.16 * grow})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.ellipse(0, 0, orbit.rx * grow, orbit.ry * grow, 0, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.restore();

        drawTail(ctx!, { cx, cy, orbit, angle, grow, length: 1.3 + (1 - grow) * 1.5, rgb: comet.rgb, alpha: grow, width: 5 });
        const head = pointOn(orbit, angle, grow);
        ctx!.shadowBlur = 16;
        ctx!.shadowColor = `rgba(${comet.rgb}, 0.9)`;
        ctx!.fillStyle = `rgba(255, 255, 255, ${0.9 * grow})`;
        ctx!.beginPath();
        ctx!.arc(cx + head.x, cy + head.y, 2.5 + 1.5 * head.depth + (index === 0 ? 0.5 : 0), 0, Math.PI * 2);
        ctx!.fill();
      });
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none h-full w-full ${className}`} />;
}
