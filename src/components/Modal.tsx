"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#02040b]/70 p-3 backdrop-blur-sm sm:items-center"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5 text-white"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-xl leading-none text-white/60 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-[#4d84ff] px-4 py-2 text-sm font-medium text-white shadow-[0_6px_24px_rgba(77,132,255,0.35)] transition hover:bg-[#3b70f0] disabled:cursor-not-allowed disabled:opacity-60";

export const ghostBtn =
  "inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const fieldClass =
  "mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-[#4d84ff] placeholder:text-white/35 focus:ring-2";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-white/75">
      {label}
      {children}
    </label>
  );
}
