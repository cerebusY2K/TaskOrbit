import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, TEMPLATE_PAGES, pageUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [...PUBLIC_PAGES, ...TEMPLATE_PAGES].map((page) => ({
    url: pageUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
