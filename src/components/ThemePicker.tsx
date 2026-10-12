"use client";

import { useEffect, useRef, useState } from "react";
import { applyTheme, DEFAULT_THEME, THEME_STORAGE_KEY, THEMES } from "@/lib/themes";

export function ThemePicker({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(DEFAULT_THEME);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = document.documentElement.dataset.theme ?? DEFAULT_THEME;
    applyTheme(saved);
    setCurrent(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: string) {
    applyTheme(id);
    setCurrent(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Private mode: the theme still applies for this visit.
    }
  }

  return (
    <div ref={root} className="relative">
      <button type="button" className={className} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
        Theme
      </button>
      {open ? (
        <div className="glass-panel absolute right-0 top-full z-50 mt-2 w-52 rounded-xl p-2">
          <p className="px-2 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-white/50">Color theme</p>
          <div role="radiogroup" aria-label="Color theme" className="grid gap-1">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={current === theme.id}
                className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                  current === theme.id ? "bg-white/10 font-medium text-white" : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => choose(theme.id)}
              >
                <span
                  aria-hidden
                  className="relative h-5 w-5 shrink-0 rounded-full border border-white/20"
                  style={{ background: theme.background }}
                >
                  <span className="absolute inset-1 rounded-full" style={{ background: theme.accent }} />
                </span>
                <span className="flex-1">{theme.name}</span>
                {current === theme.id ? <span aria-hidden>✓</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
