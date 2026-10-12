import Link from "next/link";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import { publicMetadata } from "@/lib/site";
import { BOARD_TEMPLATES } from "@/lib/templates";

export const metadata = publicMetadata("/features");

export default function FeaturesPage() {
  return (
    <article>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-soft">TaskOrb</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Task board features for a small team</h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">
        TaskOrb is a free task board. Work is organised as boards, then cards, then tasks. You can look at the same
        work as an orbit, as a plain board, as a timeline or as a calendar, and each task can say what it is waiting
        on.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Boards, cards and tasks</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A board is a project or an area of work. The first time you sign in, TaskOrb creates five boards to start
        from: Work, Personal, Projects, Follow-ups and Ideas. You can rename them, recolour them, add more, or delete
        one. The app keeps at least one board.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A new board can start blank or from one of {BOARD_TEMPLATES.length}{" "}
        <Link href="/templates" className="text-accent-soft underline-offset-2 hover:underline">
          templates
        </Link>
        , such as a two-week sprint, a content calendar or a product launch. The template fills in the cards and dated
        tasks, and you can rename the board before you create it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The app comes in six colour themes: Midnight, Aurora, Nebula, Ember, Rose and a light Daylight theme. Pick one
        from Theme in the top bar, and it is remembered on that device.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Cards sit on a board. They are the columns: a person, a workstream, a client, whatever the board is about.
        Your first board also gets a card called Me. Every board has a Done card. Marking a task done moves it there,
        and reopening it sends it back to the card it came from.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A task has a name, an owner, a priority (low, medium, high or urgent), a status, a from date and a to date,
        plus labels, a checklist and notes. The status is open, in progress, on hold or done. On hold asks for a reason. If the to date has
        passed and the task is not done, TaskOrb marks it overdue in red. The board records the last time the task
        changed.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        A task with a to date can repeat every day, week or month. When you finish it, a fresh copy is added to the
        same card with the next to date and the checklist unticked.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Find your work</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        My tasks lists every open task assigned to you, across all your boards, grouped into overdue, due today, the
        next seven days and later. On a board, search the task names, notes, labels and checklists, and filter by owner,
        priority, status, label or overdue. Filters apply to every view.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        On the morning a task is due, its owner gets a reminder, and another the day after if it is still not done.
        If nobody owns the task, the reminder goes to the board owner. Reminders arrive as notices in the app, and
        as push notifications if you turn those on.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Talk on the task</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Every task has comments. The person it is assigned to, whoever added it and anyone who already commented get a
        notice when someone replies. Each task and each board also keeps an activity history: who added, renamed,
        assigned, moved or finished what, and when.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Four ways to see the same board</h2>
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
          <Link href="/gantt" className="text-accent-soft underline decoration-white/20 underline-offset-2 hover:text-white">
            Gantt chart of the board
          </Link>
          , grouped by task or by person. Tasks need a from date or a to date to appear as bars.
        </li>
        <li>
          <strong className="font-medium text-white/85">Calendar.</strong> A month view of tasks by their to date.
          Drag a task to another day to move its dates. On a phone it becomes a list of the days that have work.
        </li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Bring your boards with you</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Import a board from a Trello JSON export, or from a CSV file out of Asana, a spreadsheet or another tool.
        Lists or sections become cards, and the tasks keep their due dates, labels, checklists and descriptions.
        Finished work goes straight to the Done card. Owners are not imported, so assign tasks afterwards.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">What a task is waiting on</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Each task can depend on another task on the same card, or on a short note when the blocker is outside the
        board. Separate fields record what it is waiting for, what it blocks, and the next action.{" "}
        <Link
          href="/task-dependencies"
          className="text-accent-soft underline decoration-white/20 underline-offset-2 hover:text-white"
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
