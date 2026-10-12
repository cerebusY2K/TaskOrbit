import Link from "next/link";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import { publicMetadata } from "@/lib/site";

export const metadata = publicMetadata("/gantt");

export default function GanttPage() {
  return (
    <article>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">Timeline</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">A free Gantt chart for small teams</h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">
        Every TaskOrb board has a timeline view. It is a Gantt chart of that board&apos;s tasks, drawn from the from
        date to the to date. It is the same tasks as the board and the orbit, not a separate project file, and it is
        included at no charge.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">How a task becomes a bar</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Open a board and switch the view to Timeline. A task with both a from date and a to date is a bar between
        those days. If it only has one of the two, the bar is that single day. A task with neither date is listed as
        unscheduled instead of being drawn on the chart. Weekends are shaded, and a marker shows today.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The bar&apos;s colour follows the status: open, in progress, on hold or done. An overdue task, one whose to
        date is before today and that is not done, gets a red ring. Click a bar to open the task.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Group by task, or by person</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The row switch is labelled Task or Member. Task rows are grouped under the card the task sits on, so a
        workstream stays together. Member rows are the board owner and each person added to the board, including
        someone who has not opened the invite yet. Tasks with no owner, or with a name typed in rather than picked
        from the members, appear when they have dates. When two of someone&apos;s tasks overlap, they stack in lanes
        instead of hiding each other.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Each person&apos;s row shows how many tasks they have and how many are overdue. Beside the chart, a written
        summary says the same thing in sentences: how many are open, in progress, on hold or done, which ones are
        overdue, what is due in the next seven days, and what is on hold and why. That is how you see when one person
        is carrying more than the rest of the team. It does not move work around for you.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">What this chart does not do</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The timeline does not draw arrows between dependent tasks. Dependencies are stored on the task: what it
        depends on, what it is waiting for, and what it blocks. Those fields are described on the{" "}
        <Link
          href="/task-dependencies"
          className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          task dependencies page
        </Link>
        . The chart is also one board at a time. It does not merge every board you own into a single company-wide plan.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Dates are days, not hours. There is no baseline, no percent complete, and no automatic rescheduling when a
        predecessor slips. You change the from and to dates yourself.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Who it is for</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        It suits a person or a small team that already keeps work on a{" "}
        <Link href="/features" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
          task board
        </Link>{" "}
        and wants the dates visible without a separate Gantt product. Share the board with the people on it, assign
        an owner, and the member rows show whose weeks are full.
      </p>

      <RelatedGuides current="/gantt" />
      <SignInPrompt>
        Sign in with Google, open a board, and switch to Timeline. Add from and to dates on a task to place it on the
        chart.
      </SignInPrompt>
    </article>
  );
}
