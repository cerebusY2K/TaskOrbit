import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import {
  BLOG_POSTS,
  blogPath,
  blogPostMetadata,
  blogPostStructuredData,
  blogRssXml,
  collectHrefs,
  parsePost,
  readingMinutes,
  wordCount,
} from "@/lib/blog";
import { PUBLIC_PAGES, SITE_URL, TEMPLATE_PAGES } from "@/lib/site";

const PRODUCT_PATHS = ["/features", "/gantt", "/task-dependencies", "/templates"];

describe("blog", () => {
  it("parses headings, lists, emphasis and internal links", () => {
    const blocks = parsePost(`
## Section

A [board](/features) with **owners**.

- First [item](/gantt)
- Second

1. One
2. Two

Not a link: [off site](https://example.com)
`);
    expect(blocks.map((block) => block.type)).toEqual(["h2", "p", "ul", "ol", "p"]);
    expect(blocks[1]).toMatchObject({
      type: "p",
      inlines: [
        { type: "text", text: "A " },
        { type: "link", href: "/features", text: "board" },
        { type: "text", text: " with " },
        { type: "strong", text: "owners" },
        { type: "text", text: "." },
      ],
    });
    expect(blocks[4]).toMatchObject({
      type: "p",
      inlines: [
        { type: "text", text: "Not a link: " },
        { type: "text", text: "[off site](https://example.com)" },
      ],
    });
  });

  it("keeps each post in the useful length, with one topic and real links", () => {
    const known = new Set([
      ...PUBLIC_PAGES.map((page) => page.path),
      ...TEMPLATE_PAGES.map((page) => page.path),
      ...BLOG_POSTS.map((post) => blogPath(post.slug)),
    ]);
    const slugs = BLOG_POSTS.map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).not.toContain("rss.xml");

    for (const post of BLOG_POSTS) {
      const count = wordCount(post.body);
      expect(count, `${post.slug} is ${count} words`).toBeGreaterThanOrEqual(900);
      expect(count, `${post.slug} is ${count} words`).toBeLessThanOrEqual(1400);
      expect(readingMinutes(post.body)).toBeGreaterThanOrEqual(5);
      expect(post.body.split("\n").some((line) => /^#\s/.test(line))).toBe(false);
      expect(parsePost(post.body).filter((block) => block.type === "h2").length).toBeGreaterThanOrEqual(4);

      const mentions = post.body.split("TaskOrb").length - 1;
      expect(mentions).toBeGreaterThanOrEqual(1);
      expect(mentions).toBeLessThanOrEqual(4);

      const hrefs = collectHrefs(post.body);
      expect(hrefs.length).toBeGreaterThanOrEqual(3);
      for (const href of hrefs) expect(known.has(href), href).toBe(true);
      expect(hrefs.some((href) => PRODUCT_PATHS.includes(href) || href.startsWith("/templates/"))).toBe(true);
      expect(hrefs.some((href) => href.startsWith("/blog/"))).toBe(true);
      expect(post.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("publishes article metadata, BlogPosting data, the sitemap and the feed", () => {
    for (const post of BLOG_POSTS) {
      const path = blogPath(post.slug);
      const metadata = blogPostMetadata(post);
      expect(metadata.alternates).toMatchObject({ canonical: path });
      expect(metadata.description).toBe(post.description);
      expect(metadata.openGraph).toMatchObject({
        type: "article",
        title: `${post.title} · TaskOrb`,
        description: post.description,
        url: path,
        publishedTime: post.published,
      });
      const graph = blogPostStructuredData(post)["@graph"] as { "@type": string }[];
      expect(graph.map((node) => node["@type"])).toEqual(["BlogPosting", "BreadcrumbList"]);
    }

    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/blog`);
    for (const post of BLOG_POSTS) {
      const url = `${SITE_URL}${blogPath(post.slug)}`;
      expect(urls).toContain(url);
      expect(sitemap().find((entry) => entry.url === url)?.lastModified).toBe(post.published);
    }
    expect(urls.some((url) => url.endsWith("/blog/rss.xml"))).toBe(false);

    const feed = blogRssXml();
    expect(feed.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBe(true);
    expect(feed).toContain("<rss version=\"2.0\">");
    for (const post of BLOG_POSTS) {
      expect(feed).toContain(post.title);
      expect(feed).toContain(`${SITE_URL}${blogPath(post.slug)}`);
    }
  });
});
