import Link from "next/link";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import { publicMetadata, templatePath } from "@/lib/site";
import { BOARD_TEMPLATES, templateSpanDays, templateTaskCount } from "@/lib/templates";

export const metadata = publicMetadata("/templates");

export default function TemplatesPage() {
  return (
    <article>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">Templates</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Free task board templates</h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">
        Each template is a ready-made TaskOrb board. The cards are the teams or stages, and the tasks already have
        dates, priorities and dependencies. Pick one, sign in with Google, and the board is created in your workspace
        with the dates counted from today. Change anything you like after that.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {BOARD_TEMPLATES.map((template) => (
          <li
            key={template.slug}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            style={{ borderTopColor: template.color, borderTopWidth: 3 }}
          >
            <h2 className="font-display text-xl font-semibold tracking-tight">
              <Link href={templatePath(template.slug)} className="hover:text-[#9dbcff]">
                {template.name}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{template.intro}</p>
            <p className="mt-3 text-xs text-white/50">
              {template.cards.length} cards · {templateTaskCount(template)} tasks · about{" "}
              {Math.ceil(templateSpanDays(template) / 7)} weeks
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                href={`/?template=${template.slug}`}
                className="rounded-xl bg-white px-3 py-1.5 font-semibold text-[#0b1430] transition hover:bg-[#eef3ff]"
              >
                Use this template
              </Link>
              <Link
                href={templatePath(template.slug)}
                className="px-1 py-1.5 text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                See the tasks
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">What you get</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A new board named after the template, one card per team or stage, and a Done card. Tasks start as open with
        no owner. Where one task has to finish before another can start, the later task already depends on it. Where
        a task is waiting on something outside its card, the Waiting for field says what. Open the{" "}
        <Link href="/gantt" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
          timeline
        </Link>{" "}
        to see the whole plan as a Gantt chart, then share the board&apos;s invite link and assign the tasks.
      </p>

      <RelatedGuides current="/templates" />
      <SignInPrompt>
        Prefer to start from scratch? Sign in with Google and five starter boards are already there.
      </SignInPrompt>
    </article>
  );
}
