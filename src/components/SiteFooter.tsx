import Link from "next/link";
import { PUBLIC_PAGES, SITE_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-white/45">
      <nav aria-label="Footer" className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-2">
        {PUBLIC_PAGES.map((page) => (
          <Link key={page.path} href={page.path} className="hover:text-white">
            {page.label}
          </Link>
        ))}
      </nav>
      <p className="mt-4">
        © {new Date().getFullYear()} TaskOrb ·{" "}
        <a href={SITE_URL} className="hover:text-white">
          taskorb.app
        </a>
      </p>
    </footer>
  );
}
