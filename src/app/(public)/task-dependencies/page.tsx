import Link from "next/link";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import { publicMetadata } from "@/lib/site";

export const metadata = publicMetadata("/task-dependencies");

export default function DependenciesPage() {
  return (
    <article>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">Waiting on</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">See what every task is waiting on</h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">
        A status of &quot;in progress&quot; does not say why something else is stuck. TaskOrb keeps the blocker on the
        task itself: a link to another task, a note about something outside the board, what you are waiting for, and
        what this task is holding up.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Depends on another task</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        On a task, Depends on can point at another task on the same card. The board shows that task&apos;s name next
        to Depends on. TaskOrb refuses a link that would loop back on itself, including through a chain of other
        tasks. The message is &quot;That would make a circular dependency.&quot;
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        If the blocker is not a task on that card, choose Something else and type it. That covers a person outside
        the team, a delivery, or another company. It stays as a written note rather than a live link.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Dependencies are per card. Drag a task onto a different card and a link to a task that stayed behind is kept
        as the parent&apos;s name, so you do not lose the history, but it is no longer a live link. You can only drop
        a task on a card in the same board.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Waiting for, and blocks</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Two short fields sit next to the dependency. Waiting for is who or what you need before you can move. Blocks
        is what cannot start until this task is done. They are notes you write, not a second diagram. A next-action
        line is there for the single thing to do next, and notes hold the longer context.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">On hold, blocked, and overdue</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Status is separate from the dependency. A task is open, in progress, on hold or done. Putting it on hold
        requires a reason, so &quot;on hold&quot; is not an empty label. The hold reason shows up in the per-person
        summary on the timeline.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Overdue is calculated, not a status you pick. If the to date is before today and the task is not done, the
        board shows it in red. On the simple board that task stays marked until you set it to done. The{" "}
        <Link href="/gantt" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
          Gantt chart
        </Link>{" "}
        draws a red ring on the same tasks. The timeline does not draw dependency arrows. Read the task to see what
        it is waiting on.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">A small example</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A card called Launch has &quot;Write the announcement&quot; and &quot;Send the announcement&quot;. Send depends
        on Write. Write is waiting for a quote from someone who is not on the board, so that dependency is typed in
        rather than linked. Send blocks &quot;Publish the blog post&quot;, written in Blocks. If the quote slips,
        put Write on hold and say why. The owner, the dates and the red overdue mark are the same fields you already
        use on the{" "}
        <Link href="/features" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
          rest of the board
        </Link>
        .
      </p>

      <RelatedGuides current="/task-dependencies" />
      <SignInPrompt>
        Sign in with Google, open a task, and set Depends on, Waiting for, or Blocks. The board is free.
      </SignInPrompt>
    </article>
  );
}
