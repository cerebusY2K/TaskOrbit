import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedGuides } from "@/components/PublicChrome";
import { pageMetadata, templatePath } from "@/lib/site";
import { BOARD_TEMPLATES, boardTemplate, templateSpanDays, templateTaskCount, type TemplateTask } from "@/lib/templates";
import { PRIORITY_LABELS } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return BOARD_TEMPLATES.map((template) => ({ slug: template.slug }));
}

export async function generateMetadata({ params }: Props) {
  const template = boardTemplate((await params).slug);
  if (!template) return {};
  return pageMetadata({ path: templatePath(template.slug), title: template.title, description: template.description });
}

function days(task: TemplateTask) {
  const start = task.start ?? task.due;
  const due = task.due ?? task.start;
  if (start === undefined || due === undefined) return null;
  return start === due ? `Day ${start + 1}` : `Days ${start + 1}–${due + 1}`;
}

export default async function TemplatePage({ params }: Props) {
  const template = boardTemplate((await params).slug);
  if (!template) notFound();
  const others = BOARD_TEMPLATES.filter((item) => item.slug !== template.slug);
  const useHref = `/?template=${template.slug}`;

  return (
    <article>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">
        <Link href="/templates" className="hover:text-white">
          Templates
        </Link>
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{template.name} template</h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">{template.intro}</p>
      <p className="mt-3 text-sm text-white/50">
        {template.cards.length} cards · {templateTaskCount(template)} tasks · about{" "}
        {Math.ceil(templateSpanDays(template) / 7)} weeks · free
      </p>
      <Link
        href={useHref}
        className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1430] shadow-[0_8px_30px_rgba(77,132,255,0.35)] transition hover:bg-[#eef3ff]"
      >
        Use this template
      </Link>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">What is on the board</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Day 1 is the day you create the board. Every date moves with it, so the plan always starts today.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {template.cards.map((card) => (
          <section
            key={card.name}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            style={{ borderTopColor: card.color, borderTopWidth: 3 }}
          >
            <h3 className="font-display text-lg font-semibold tracking-tight">{card.name}</h3>
            <ul className="mt-3 space-y-3">
              {card.tasks.map((task) => (
                <li key={task.name} className="text-sm">
                  <p className="font-medium text-white/90">{task.name}</p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {[days(task), task.priority ? `${PRIORITY_LABELS[task.priority]} priority` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {task.dependsOn ? <p className="mt-0.5 text-xs text-[#9dbcff]">Depends on: {task.dependsOn}</p> : null}
                  {task.waitingFor ? <p className="mt-0.5 text-xs text-[#ffc56b]">Waiting for: {task.waitingFor}</p> : null}
                  {task.nextAction ? <p className="mt-0.5 text-xs text-white/60">Next action: {task.nextAction}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Best for</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/70">
        {template.bestFor.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">How to use it</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/70">
        <li>Choose Use this template and sign in with Google. The board opens with every card and task in place.</li>
        <li>Rename tasks, change dates, or delete what you do not need. Nothing is locked.</li>
        <li>
          Add the people involved and share the board&apos;s invite link, then give each task an owner. See{" "}
          <Link
            href="/task-dependencies"
            className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            how dependencies work
          </Link>
          .
        </li>
        <li>
          Switch the board to{" "}
          <Link href="/gantt" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
            Timeline
          </Link>{" "}
          to see the plan as a Gantt chart, grouped by task or by person.
        </li>
      </ol>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Other templates</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {others.map((item) => (
          <li key={item.slug}>
            <Link
              href={templatePath(item.slug)}
              className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              {item.name} template
            </Link>
          </li>
        ))}
      </ul>

      <RelatedGuides current={templatePath(template.slug)} />
      <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Start your {template.name.toLowerCase()} board</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/65">
          Free, with Google sign-in. The board is private until you share its invite link.
        </p>
        <Link
          href={useHref}
          className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1430] shadow-[0_8px_30px_rgba(77,132,255,0.35)] transition hover:bg-[#eef3ff]"
        >
          Use this template
        </Link>
      </section>
    </article>
  );
}
