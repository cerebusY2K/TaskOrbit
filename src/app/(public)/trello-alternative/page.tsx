import Link from "next/link";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import { publicMetadata } from "@/lib/site";

export const metadata = publicMetadata("/trello-alternative");

const ROWS = [
  ["Boards with columns of cards", "Yes: boards, cards, then tasks on each card", "Yes: boards, lists, then cards"],
  ["What a task is waiting on", "Built in: depends on, waiting for, blocks, next action", "Usually a label, checklist or Power-Up"],
  ["Labels, checklists and search", "Yes, plus a My tasks list across boards", "Yes"],
  ["Gantt chart / timeline", "Included on every board, by task or by person", "Depends on your plan"],
  ["Integrations and automation", "None", "Many Power-Ups and built-in automation"],
  ["Due-date reminders", "Yes: in the app and by push", "Yes"],
  ["Comments and activity", "Yes: comments and a history on each task and board", "Yes"],
  ["Attachments", "Not yet: notes on the task", "Yes"],
  ["Sign-in", "Google only", "Email, Google and others"],
  ["Price", "Free, no paid plan", "Free plan and paid plans"],
] as const;

export default function TrelloAlternativePage() {
  return (
    <article>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">Compare</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        A free Trello alternative that shows what each task is waiting on
      </h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">
        Trello made the card board popular, and it is very good at it. TaskOrb uses a similar shape (boards, cards and
        tasks) but is built around one question Trello leaves to you: what is this task waiting on, and who is it
        blocking? This page is an honest comparison, including when Trello is the better choice.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">At a glance</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-white/85">
            <tr className="border-b border-white/15">
              <th className="py-2 pr-4 font-medium" />
              <th className="py-2 pr-4 font-medium">TaskOrb</th>
              <th className="py-2 font-medium">Trello</th>
            </tr>
          </thead>
          <tbody className="text-white/70">
            {ROWS.map(([label, ours, theirs]) => (
              <tr key={label} className="border-b border-white/10 align-top">
                <th scope="row" className="py-2 pr-4 font-medium text-white/85">
                  {label}
                </th>
                <td className="py-2 pr-4">{ours}</td>
                <td className="py-2">{theirs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-white/50">
        Trello&apos;s features and plans change. Check Trello&apos;s own pricing page for what each plan includes today.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Where TaskOrb is different</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        In TaskOrb, a task can depend on another task on the same card, and has separate fields for what it is waiting
        for, what it blocks, and the next action. On hold is a status that asks for a reason. That makes a stuck task
        say why it is stuck, instead of sitting in a column. The{" "}
        <Link
          href="/task-dependencies"
          className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          task dependencies guide
        </Link>{" "}
        shows how those fields work.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Every board also has a{" "}
        <Link href="/gantt" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
          timeline view
        </Link>{" "}
        that draws tasks from their from date to their to date, grouped by task or by person, so you can see whose
        weeks are full. It is part of the free product, not an add-on.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">When Trello is the better choice</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/70">
        <li>You rely on integrations with other apps, or on rules that move cards automatically.</li>
        <li>You need file attachments on each card.</li>
        <li>Your team does not use Google accounts.</li>
        <li>You want a large ecosystem of templates, guides and people who already know the tool.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        TaskOrb is a small, focused product. If those things matter more than seeing blockers and dates, stay with
        Trello.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Moving over</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        There is no importer. The quickest start is a{" "}
        <Link href="/templates" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
          ready-made template
        </Link>
        , or one of the five starter boards you get on first sign-in. Make a card for each Trello list you still use,
        and copy over the tasks that are open.
      </p>

      <RelatedGuides current="/trello-alternative" />
      <SignInPrompt>
        Sign in with Google to try TaskOrb next to your Trello board. It is free, and your boards stay private until
        you share them.
      </SignInPrompt>
    </article>
  );
}
