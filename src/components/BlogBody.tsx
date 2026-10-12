import Link from "next/link";
import { parsePost, type Inline } from "@/lib/blog";

const linkClass = "text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white";

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((item, index) => {
        if (item.type === "link") {
          return (
            <Link key={index} href={item.href} className={linkClass}>
              {item.text}
            </Link>
          );
        }
        if (item.type === "strong") {
          return (
            <strong key={index} className="font-medium text-white/85">
              {item.text}
            </strong>
          );
        }
        return <span key={index}>{item.text}</span>;
      })}
    </>
  );
}

export function BlogBody({ body }: { body: string }) {
  const blocks = parsePost(body);
  let seenParagraph = false;
  return (
    <div>
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2 key={index} className="mt-10 font-display text-2xl font-semibold tracking-tight">
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={index} className="mt-8 font-display text-xl font-semibold tracking-tight">
              {block.text}
            </h3>
          );
        }
        if (block.type === "ul" || block.type === "ol") {
          const List = block.type === "ul" ? "ul" : "ol";
          return (
            <List
              key={index}
              className={`mt-3 space-y-2 pl-5 text-sm leading-relaxed text-white/70 ${
                block.type === "ul" ? "list-disc" : "list-decimal"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inlines items={item} />
                </li>
              ))}
            </List>
          );
        }
        const lead = !seenParagraph;
        seenParagraph = true;
        return (
          <p
            key={index}
            className={
              lead ? "mt-4 text-base leading-relaxed text-white/70" : "mt-3 text-sm leading-relaxed text-white/70"
            }
          >
            <Inlines items={block.inlines} />
          </p>
        );
      })}
    </div>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
