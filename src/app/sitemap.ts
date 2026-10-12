import type { MetadataRoute } from "next";
import { BLOG_PAGES } from "@/lib/blog";
import { PUBLIC_PAGES, TEMPLATE_PAGES, pageUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [...PUBLIC_PAGES, ...TEMPLATE_PAGES].map((page) => ({
    url: pageUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const posts = BLOG_PAGES.map((page) => ({
    url: pageUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    lastModified: page.lastModified,
  }));
  return [...pages, ...posts];
}
