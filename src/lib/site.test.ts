import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { PUBLIC_PAGES, SITE_URL, fullTitle, publicMetadata } from "@/lib/site";

describe("public pages", () => {
  it("lists each public path once", () => {
    const paths = PUBLIC_PAGES.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toEqual(["/", "/features", "/gantt", "/task-dependencies", "/privacy", "/terms"]);
  });

  it("gives every page a unique title and description", () => {
    const titles = PUBLIC_PAGES.map((page) => fullTitle(page));
    const descriptions = PUBLIC_PAGES.map((page) => page.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const description of descriptions) {
      expect(description.length).toBeGreaterThan(40);
      expect(description.length).toBeLessThanOrEqual(180);
    }
  });

  it("puts every public page in the sitemap and nowhere private", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual(PUBLIC_PAGES.map((page) => (page.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${page.path}`)));
    expect(urls.some((url) => /\/(admin|api|invite)(\/|$)/.test(url))).toBe(false);
  });

  it("keeps robots.txt blocking private routes", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule?.allow).toBe("/");
    expect(rule?.disallow).toEqual(["/api/", "/admin", "/invite/"]);
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("points each page at its own canonical", () => {
    for (const page of PUBLIC_PAGES) {
      const metadata = publicMetadata(page.path);
      expect(metadata.alternates).toEqual({ canonical: page.path === "/" ? "/" : page.path });
      expect(metadata.description).toBe(page.description);
    }
  });
});
