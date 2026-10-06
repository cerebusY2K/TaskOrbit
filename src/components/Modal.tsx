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
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#1c1915]/45 p-3 sm:items-center"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-[#172b4d]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-xl leading-none text-[#6f675e] hover:bg-sand"
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
  "inline-flex items-center justify-center rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0952b8] disabled:cursor-not-allowed disabled:opacity-60";

export const ghostBtn =
  "inline-flex items-center justify-center rounded-lg border border-[#dfe1e6] bg-white px-4 py-2 text-sm font-medium text-[#172b4d] transition hover:bg-[#f1f2f4] disabled:cursor-not-allowed disabled:opacity-60";

export const fieldClass =
  "mt-1 w-full rounded-lg border border-[#dfe1e6] bg-white px-3 py-2 text-sm text-[#172b4d] outline-none ring-[#0c66e4] focus:ring-2";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-[#4d463d]">
      {label}
      {children}
    </label>
  );
}
