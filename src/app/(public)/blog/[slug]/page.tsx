import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBody, JsonLd } from "@/components/BlogBody";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import {
  BLOG_POSTS,
  blogPath,
  blogPost,
  blogPostMetadata,
  blogPostStructuredData,
  formatPublished,
  postsNewestFirst,
  readingMinutes,
} from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = blogPost((await params).slug);
  if (!post) return {};
  return blogPostMetadata(post);
}

export default async function BlogPostPage({ params }: Props) {
  const post = blogPost((await params).slug);
  if (!post) notFound();
  const others = postsNewestFirst().filter((item) => item.slug !== post.slug);

  return (
    <article>
      <JsonLd data={blogPostStructuredData(post)} />
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">
        <Link href="/blog" className="hover:text-white">
          Blog
        </Link>
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-3 text-sm text-white/50">
        <time dateTime={post.published}>{formatPublished(post.published)}</time>
        {" · "}
        {readingMinutes(post.body)} min read
      </p>
      <BlogBody body={post.body} />

      <nav aria-label="More from the blog" className="mt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">More from the blog</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {others.map((item) => (
            <li key={item.slug}>
              <Link
                href={blogPath(item.slug)}
                className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <RelatedGuides current={blogPath(post.slug)} />
      <SignInPrompt>{post.cta}</SignInPrompt>
    </article>
  );
}
