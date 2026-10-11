import Link from "next/link";
import { OrbitMark } from "@/components/OrbitMark";
import { PUBLIC_PAGES } from "@/lib/site";

const HEADER_LINKS = ["/features", "/gantt", "/task-dependencies"] as const;

export function PublicHeader() {
  const links = HEADER_LINKS.map((path) => PUBLIC_PAGES.find((page) => page.path === path)!);
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-5 py-6">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <OrbitMark className="h-8 w-8" />
        TaskOrb
      </Link>
      <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
        {links.map((page) => (
          <Link key={page.path} href={page.path} className="hover:text-white">
            {page.label}
          </Link>
        ))}
        <Link
          href="/"
          className="rounded-xl bg-white px-3 py-1.5 font-semibold text-[#0b1430] transition hover:bg-[#eef3ff]"
        >
          Open TaskOrb
        </Link>
      </nav>
    </header>
  );
}

export function SignInPrompt({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center">
      <h2 className="font-display text-2xl font-semibold tracking-tight">Open your board</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/65">{children}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1430] shadow-[0_8px_30px_rgba(77,132,255,0.35)] transition hover:bg-[#eef3ff]"
      >
        Sign in with Google
      </Link>
    </section>
  );
}

export function RelatedGuides({ current }: { current: string }) {
  const pages = [
    { href: "/", label: "TaskOrb homepage" },
    { href: "/features", label: "Task board features" },
    { href: "/gantt", label: "Free Gantt chart for small teams" },
    { href: "/task-dependencies", label: "See what every task is waiting on" },
  ].filter((page) => page.href !== current);
  return (
    <nav aria-label="Related" className="mt-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight">Related</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {pages.map((page) => (
          <li key={page.href}>
            <Link href={page.href} className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
              {page.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Todo({ children }: { children: string }) {
  return (
    <span className="rounded bg-[#ffb547]/15 px-1.5 py-0.5 font-medium text-[#ffd7a8]">[TODO: {children}]</span>
  );
}
