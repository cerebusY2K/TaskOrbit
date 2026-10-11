import Link from "next/link";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import { publicMetadata } from "@/lib/site";

export const metadata = publicMetadata("/features");

export default function FeaturesPage() {
  return (
    <article>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">TaskOrb</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Task board features for a small team</h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">
        TaskOrb is a free task board. Work is organised as boards, then cards, then tasks. You can look at the same
        work as an orbit, as a plain board, or as a timeline, and each task can say what it is waiting on.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Boards, cards and tasks</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A board is a project or an area of work. The first time you sign in, TaskOrb creates five boards to start
        from: Work, Personal, Projects, Follow-ups and Ideas. You can rename them, recolour them, add more, or delete
        one. The app keeps at least one board.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Cards sit on a board. They are the columns: a person, a workstream, a client, whatever the board is about.
        Your first board also gets a card called Me. Every board has a Done card. Marking a task done moves it there,
        and reopening it sends it back to the card it came from.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A task has a name, an owner, a priority (low, medium, high or urgent), a status, a from date and a to date,
        plus notes. The status is open, in progress, on hold or done. On hold asks for a reason. If the to date has
        passed and the task is not done, TaskOrb marks it overdue in red. The board records the last time the task
        changed.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Three ways to see the same board</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/70">
        <li>
          <strong className="font-medium text-white/85">Orbit.</strong> Your boards orbit the workspace. Open one and
          its tasks orbit their cards. Hover an item to pause it, then click to open it.
        </li>
        <li>
          <strong className="font-medium text-white/85">Simple board.</strong> Cards in a row, tasks listed on them.
          Drag a task onto another card on the same board. Drop it on Done to finish it, or drag it off Done to reopen
          it.
        </li>
        <li>
          <strong className="font-medium text-white/85">Timeline.</strong> A{" "}
          <Link href="/gantt" className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white">
            Gantt chart of the board
          </Link>
          , grouped by task or by person. Tasks need a from date or a to date to appear as bars.
        </li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">What a task is waiting on</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Each task can depend on another task on the same card, or on a short note when the blocker is outside the
        board. Separate fields record what it is waiting for, what it blocks, and the next action.{" "}
        <Link
          href="/task-dependencies"
          className="text-[#9dbcff] underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          How dependencies work
        </Link>
        .
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Sharing a board</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A board stays private until you share it. Add a person by name and email so you can assign them tasks, then
        copy the board&apos;s invite link. Anyone who opens that link and signs in with Google joins the board and can
        see it. They can edit tasks they added or that are assigned to them. You can remove someone, and they can
        leave. TaskOrb does not email the invite for you.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        When a task is assigned to someone who has already joined, they get a notice in the app. If they have turned
        push notifications on, that notice is also pushed to the device. The board owner is told when someone joins or
        leaves.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Sign-in, phones and price</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Sign-in is Google only. There is no password to create. TaskOrb runs in the browser on a phone or a computer,
        and you can add it to your home screen from the browser. Push notifications are off until you turn them on.
        On iPhone and iPad, push needs the home-screen app. The product is free to use. There is no paid plan in the
        app.
      </p>

      <RelatedGuides current="/features" />
      <SignInPrompt>
        Sign in with Google and the starter boards are already there. Your boards stay private until you share a link.
      </SignInPrompt>
    </article>
  );
}
