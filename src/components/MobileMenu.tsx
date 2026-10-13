"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ThemeChoices } from "./ThemePicker";

export type MobileMenuItem = {
  label: string;
  onSelect?: () => void;
  href?: string;
  /** Shown as a count pill after the label. */
  count?: number;
  alert?: boolean;
  tone?: "danger";
};

export const mobileMenuRow =
  "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-white/90 transition active:bg-white/10";

/** Phone-only menu button that opens a bottom sheet with the screen's actions. */
export function MobileMenu({ title, items, footer }: { title: string; items: MobileMenuItem[]; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const alert = items.some((item) => item.alert && item.count);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={alert ? "Menu, you have updates" : "Menu"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 active:bg-white/15 sm:hidden"
        onClick={() => setOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {alert ? <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface" /> : null}
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-40 flex items-end bg-scrim/70 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="glass-panel max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 text-white"
                onClick={(event) => event.stopPropagation()}
              >
                <div aria-hidden className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20" />
                <div className="flex items-center justify-between px-3 pb-1">
                  <h2 className="text-base font-semibold">{title}</h2>
                  <button
                    type="button"
                    className="rounded-full px-3 py-1.5 text-sm text-white/60 active:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <nav className="grid">
                  {items.map((item) =>
                    item.href ? (
                      <a key={item.label} href={item.href} className={mobileMenuRow}>
                        {item.label}
                      </a>
                    ) : (
                      <button
                        key={item.label}
                        type="button"
                        className={`${mobileMenuRow} ${item.tone === "danger" ? "text-danger-soft" : ""}`}
                        onClick={() => {
                          setOpen(false);
                          item.onSelect?.();
                        }}
                      >
                        {item.label}
                        {item.count ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              item.alert ? "bg-danger text-on-accent" : "bg-white/10 text-white/70"
                            }`}
                          >
                            {item.count}
                          </span>
                        ) : null}
                      </button>
                    ),
                  )}
                </nav>
                <p className="px-3 pb-2 pt-4 text-xs font-medium uppercase tracking-wide text-white/50">Color theme</p>
                <div className="px-1">
                  <ThemeChoices />
                </div>
                {footer ? <div className="mt-3 grid gap-1">{footer}</div> : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
