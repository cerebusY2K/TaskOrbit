import Link from "next/link";
import { BlogBody, JsonLd } from "@/components/BlogBody";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import { blogIndexMetadata, blogIndexStructuredData, blogPath, formatPublished, postsNewestFirst, readingMinutes } from "@/lib/blog";

export const metadata = blogIndexMetadata();

export default function BlogIndexPage() {
  const posts = postsNewestFirst();
  return (
    <article>
      <JsonLd data={blogIndexStructuredData()} />
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">Blog</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Guides for small teams</h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">
        Short guides for freelancers, studio leads and agency owners. Each one is about a situation a small team
        actually hits: work waiting on something else, a task that should be paused, a plan that needs dates, or a
        person whose week is already full.
      </p>
      <p className="mt-3 text-sm">
        <Link
          href="/blog/rss.xml"
          className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          RSS feed
        </Link>
      </p>

      <ul className="mt-8 space-y-4">
        {posts.map((post) => (
          <li key={post.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-white/50">
              <time dateTime={post.published}>{formatPublished(post.published)}</time>
              {" · "}
              {readingMinutes(post.body)} min read
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
              <Link href={blogPath(post.slug)} className="hover:text-[#9dbcff]">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{post.description}</p>
          </li>
        ))}
      </ul>

      <RelatedGuides current="/blog" />
      <SignInPrompt>
        Sign in with Google and the starter boards are already there. Your boards stay private until you share a link.
      </SignInPrompt>
    </article>
  );
}
