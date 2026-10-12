import type { Metadata } from "next";
import Link from "next/link";
import { OrbitMark } from "@/components/OrbitMark";

export const metadata: Metadata = {
  title: { absolute: "Page not found · TaskOrb" },
  description: "That page is not on TaskOrb.",
  alternates: { canonical: null },
  openGraph: {
    title: "Page not found · TaskOrb",
    description: "That page is not on TaskOrb.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Page not found · TaskOrb",
    description: "That page is not on TaskOrb.",
  },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center text-white">
      <OrbitMark className="h-12 w-12" />
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/65">That address is not part of TaskOrb.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1430] transition hover:bg-[#eef3ff]"
      >
        Back to TaskOrb
      </Link>
    </main>
  );
}
