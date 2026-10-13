import Link from "next/link";
import { OrbitMark } from "@/components/OrbitMark";
import { CONTACT_EMAIL, PUBLIC_PAGES } from "@/lib/site";

const HEADER_LINKS = ["/features", "/templates", "/gantt", "/task-dependencies"] as const;

export function PublicHeader() {
  const links = HEADER_LINKS.map((path) => PUBLIC_PAGES.find((page) => page.path === path)!);
  return (
    <header className="mx-auto grid w-full max-w-3xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:flex sm:justify-between sm:py-6">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <OrbitMark className="h-8 w-8" />
        TaskOrb
      </Link>
      <nav
        aria-label="Primary"
        className="scrollbar-none col-span-2 row-start-2 -mx-5 flex items-center gap-1 overflow-x-auto px-4 text-sm text-white/70 sm:order-none sm:mx-0 sm:gap-x-4 sm:overflow-visible sm:px-0"
      >
        {links.map((page) => (
          <Link
            key={page.path}
            href={page.path}
            className="shrink-0 whitespace-nowrap rounded-full bg-white/5 px-3 py-1.5 hover:text-white sm:bg-transparent sm:px-0 sm:py-0"
          >
            {page.label}
          </Link>
        ))}
        <Link
          href="/"
          className="hidden rounded-xl bg-white px-3 py-1.5 font-semibold text-surface transition hover:bg-white/90 sm:inline-block"
        >
          Open TaskOrb
        </Link>
      </nav>
      <Link
        href="/"
        className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-surface transition hover:bg-white/90 sm:hidden"
      >
        Open TaskOrb
      </Link>
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
        className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-surface shadow-[0_8px_30px_rgb(var(--accent)/0.35)] transition hover:bg-white/90"
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
    { href: "/templates", label: "Free task board templates" },
    { href: "/gantt", label: "Free Gantt chart for small teams" },
    { href: "/task-dependencies", label: "See what every task is waiting on" },
    { href: "/blog", label: "Guides for small teams" },
  ].filter((page) => page.href !== current);
  return (
    <nav aria-label="Related" className="mt-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight">Related</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {pages.map((page) => (
          <li key={page.href}>
            <Link href={page.href} className="text-accent-soft underline decoration-white/20 underline-offset-2 hover:text-white">
              {page.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-soft underline decoration-white/20 underline-offset-2 hover:text-white">
      {CONTACT_EMAIL}
    </a>
  );
}
