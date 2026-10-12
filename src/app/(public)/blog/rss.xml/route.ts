import { blogRssXml } from "@/lib/blog";

export const dynamic = "force-static";

export function GET() {
  return new Response(blogRssXml(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
