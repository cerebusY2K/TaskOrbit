import type { Metadata } from "next";

export const SITE_URL = (process.env.SITE_URL || "https://taskorb.app").replace(/\/$/, "");

export const SITE_TITLE = "TaskOrb – task boards that show what every task is waiting on";

export const SITE_DESCRIPTION =
  "TaskOrb is a free task board for you and your team. Organise work into boards and cards, assign owners and dates, see what is blocked, and plan it on a timeline.";

export const LEGAL_UPDATED = "8 October 2026";

export type ChangeFrequency = "weekly" | "monthly" | "yearly";

export type PublicPage = {
  path: string;
  label: string;
  /** Title segment. Homepage title is already the full string. */
  title: string;
  absoluteTitle?: boolean;
  description: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

export const PUBLIC_PAGES: readonly PublicPage[] = [
  {
    path: "/",
    label: "Home",
    title: SITE_TITLE,
    absoluteTitle: true,
    description: SITE_DESCRIPTION,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/features",
    label: "Features",
    title: "Task board features",
    description:
      "Boards, cards and tasks, an orbit view, a timeline and Gantt chart, dependencies, invite links and push notifications. TaskOrb is free, with Google sign-in.",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/gantt",
    label: "Gantt chart",
    title: "Free Gantt chart for small teams",
    description:
      "TaskOrb's timeline is a free Gantt chart for small teams. Plot each task from its start date to its due date, and group rows by task or by person.",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/task-dependencies",
    label: "Dependencies",
    title: "See what every task is waiting on",
    description:
      "Record what a task depends on, what it is waiting for, and what it blocks. TaskOrb is a free task board that keeps blocked and on-hold work visible.",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/privacy",
    label: "Privacy",
    title: "Privacy Policy",
    description:
      "What TaskOrb stores when you sign in with Google, share a board, turn on push notifications, or visit the site. No third-party analytics.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    label: "Terms",
    title: "Terms of Service",
    description:
      "Terms for using TaskOrb, a free task board. Covers Google sign-in, private boards, invite links, your content, and a service offered at no charge.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

export function publicPage(path: string) {
  const page = PUBLIC_PAGES.find((item) => item.path === path);
  if (!page) throw new Error(`Unknown public page: ${path}`);
  return page;
}

export function pageUrl(path: string) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function fullTitle(page: PublicPage) {
  return page.absoluteTitle ? page.title : `${page.title} · TaskOrb`;
}

const SHARE_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "TaskOrb: every task, in orbit. Task boards that show who owns what, and what each task is waiting on.",
};

export function publicMetadata(path: string): Metadata {
  const page = publicPage(path);
  const title = fullTitle(page);
  const canonical = page.path === "/" ? "/" : page.path;
  // The homepage picks up the file-based share image. Other pages replace Open Graph
  // metadata, so they name the same image explicitly.
  const images = page.path === "/" ? undefined : [SHARE_IMAGE];
  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: page.description,
      url: canonical,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      ...(images ? { images: [SHARE_IMAGE.url] } : {}),
    },
  };
}
