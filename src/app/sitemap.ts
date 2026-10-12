import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, pageUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((page) => ({
    url: pageUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
