import type { Metadata } from "next";
import { BLOG_POSTS } from "./blog-posts";
import type { BlogPost } from "./blog-types";
import { SHARE_IMAGE, SITE_URL, fullTitle, pageMetadata, pageUrl, publicMetadata, publicPage } from "./site";

export type { BlogPost } from "./blog-types";

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; href: string; text: string };

export type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; inlines: Inline[] }
  | { type: "ul"; items: Inline[][] }
  | { type: "ol"; items: Inline[][] };

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

export { BLOG_POSTS };

export function blogPath(slug: string) {
  return `/blog/${slug}`;
}

export function blogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function postsNewestFirst() {
  return [...BLOG_POSTS].sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
}

export function formatPublished(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//") && !href.includes(":") && !/\s/.test(href);
}

export function parseInlines(input: string): Inline[] {
  const inlines: Inline[] = [];
  let last = 0;
  for (const match of input.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) inlines.push({ type: "text", text: input.slice(last, index) });
    if (match[1] !== undefined) {
      inlines.push({ type: "strong", text: match[1] });
    } else {
      const label = match[2] ?? "";
      const href = match[3] ?? "";
      if (isInternalHref(href)) inlines.push({ type: "link", href, text: label });
      else inlines.push({ type: "text", text: match[0] });
    }
    last = index + match[0].length;
  }
  if (last < input.length) inlines.push({ type: "text", text: input.slice(last) });
  return inlines;
}

function isHeading(line: string) {
  return /^###?\s+/.test(line);
}

function isList(line: string) {
  return /^[-]\s+/.test(line) || /^\d+\.\s+/.test(line);
}

export function parsePost(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").trim().split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      const text = heading[2].trim();
      blocks.push(heading[1].length === 2 ? { type: "h2", text } : { type: "h3", text });
      i += 1;
      continue;
    }
    if (/^[-]\s+/.test(line)) {
      const items: Inline[][] = [];
      while (i < lines.length && /^[-]\s+/.test(lines[i])) {
        items.push(parseInlines(lines[i].replace(/^[-]\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: Inline[][] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(parseInlines(lines[i].replace(/^\d+\.\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isHeading(lines[i]) && !isList(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "p", inlines: parseInlines(para.join(" ")) });
  }
  return blocks;
}

function inlineText(inlines: Inline[]) {
  return inlines.map((item) => ("text" in item ? item.text : "")).join("");
}

export function wordCount(body: string) {
  const parts: string[] = [];
  for (const block of parsePost(body)) {
    if (block.type === "h2" || block.type === "h3") parts.push(block.text);
    else if (block.type === "p") parts.push(inlineText(block.inlines));
    else parts.push(...block.items.map(inlineText));
  }
  const text = parts.join(" ").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export function readingMinutes(body: string) {
  return Math.max(1, Math.round(wordCount(body) / 200));
}

export function collectHrefs(body: string) {
  const hrefs: string[] = [];
  for (const block of parsePost(body)) {
    const groups = block.type === "p" ? [block.inlines] : block.type === "ul" || block.type === "ol" ? block.items : [];
    for (const inlines of groups) {
      for (const inline of inlines) {
        if (inline.type === "link") hrefs.push(inline.href.split("?")[0]);
      }
    }
  }
  return hrefs;
}

export const BLOG_PAGES = BLOG_POSTS.map((post) => ({
  path: blogPath(post.slug),
  title: post.title,
  description: post.description,
  changeFrequency: "monthly" as const,
  priority: 0.6,
  lastModified: post.published,
}));

const RSS_TYPE = "application/rss+xml";

export function blogIndexMetadata(): Metadata {
  const metadata = publicMetadata("/blog");
  return {
    ...metadata,
    alternates: { canonical: "/blog", types: { [RSS_TYPE]: "/blog/rss.xml" } },
  };
}

export function blogPostMetadata(post: BlogPost): Metadata {
  const path = blogPath(post.slug);
  const metadata = pageMetadata({ path, title: post.title, description: post.description });
  return {
    ...metadata,
    authors: [{ name: "TaskOrb", url: `${SITE_URL}/` }],
    alternates: { canonical: path, types: { [RSS_TYPE]: "/blog/rss.xml" } },
    openGraph: {
      title: fullTitle({ title: post.title }),
      description: post.description,
      url: path,
      siteName: "TaskOrb",
      locale: "en_US",
      type: "article",
      publishedTime: post.published,
      modifiedTime: post.published,
      images: [SHARE_IMAGE],
    },
  };
}

export function blogPostStructuredData(post: BlogPost) {
  const url = pageUrl(blogPath(post.slug));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.published,
        dateModified: post.published,
        inLanguage: "en",
        wordCount: wordCount(post.body),
        timeRequired: `PT${readingMinutes(post.body)}M`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        image: `${SITE_URL}/opengraph-image.png`,
        author: { "@type": "Organization", name: "TaskOrb", url: `${SITE_URL}/` },
        publisher: {
          "@type": "Organization",
          name: "TaskOrb",
          url: `${SITE_URL}/`,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: pageUrl("/blog") },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}

export function blogIndexStructuredData() {
  const page = publicPage("/blog");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: "TaskOrb blog",
        description: page.description,
        url: pageUrl("/blog"),
        publisher: { "@type": "Organization", name: "TaskOrb", url: `${SITE_URL}/` },
        blogPost: postsNewestFirst().map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.published,
          url: pageUrl(blogPath(post.slug)),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: pageUrl("/blog") },
        ],
      },
    ],
  };
}

function cdata(value: string) {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

export function blogRssXml() {
  const posts = postsNewestFirst();
  const latest = posts[0]?.published ?? "2026-10-12";
  const items = posts
    .map((post) => {
      const url = pageUrl(blogPath(post.slug));
      const pubDate = new Date(`${post.published}T12:00:00.000Z`).toUTCString();
      return [
        "<item>",
        `<title>${cdata(post.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${cdata(post.description)}</description>`,
        "</item>",
      ].join("");
    })
    .join("");
  const description = publicPage("/blog").description;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${cdata("TaskOrb blog")}</title>`,
    `<link>${pageUrl("/blog")}</link>`,
    `<description>${cdata(description)}</description>`,
    "<language>en</language>",
    `<lastBuildDate>${new Date(`${latest}T12:00:00.000Z`).toUTCString()}</lastBuildDate>`,
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
