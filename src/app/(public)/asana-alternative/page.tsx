import Link from "next/link";
import { RelatedGuides, SignInPrompt } from "@/components/PublicChrome";
import { publicMetadata } from "@/lib/site";

export const metadata = publicMetadata("/asana-alternative");

const ROWS = [
  ["Projects and tasks", "Boards, cards, then tasks", "Projects, sections, tasks and subtasks"],
  ["What a task is waiting on", "Depends on, waiting for, blocks, next action", "Task dependencies; check which plans include them"],
  ["My tasks across projects", "Yes, grouped by due date", "Yes"],
  ["Comments and activity", "Yes, on each task and board", "Yes"],
  ["Calendar and recurring tasks", "Yes, on every board", "Yes"],
  ["Moving your projects", "Import an Asana CSV export: sections, tasks, dates and tags", "Exports to CSV"],
  ["Gantt chart / timeline", "Included on every board, by task or by person", "Depends on your plan"],
  ["Portfolios, goals, forms, reporting", "None", "Yes, on some plans"],
  ["Integrations and automation", "None", "Many integrations and rules"],
  ["Setup", "Sign in with Google and start", "More to set up, more to configure"],
  ["Price", "Free, no paid plan", "Free plan and paid plans"],
] as const;

export default function AsanaAlternativePage() {
  return (
    <article>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-soft">Compare</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">A simple, free Asana alternative for small teams</h1>
      <p className="mt-4 text-base leading-relaxed text-white/70">
        Asana is a full work-management platform for companies. TaskOrb is a much smaller tool: a task board with
        owners, dates, dependencies and a timeline, and nothing to configure first. If Asana feels like more than your
        team needs, this page explains what you keep, what you give up, and when Asana is the better choice.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">At a glance</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-white/85">
            <tr className="border-b border-white/15">
              <th className="py-2 pr-4 font-medium" />
              <th className="py-2 pr-4 font-medium">TaskOrb</th>
              <th className="py-2 font-medium">Asana</th>
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
        Asana&apos;s features and plans change. Check Asana&apos;s own pricing page for what each plan includes today.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">What you keep</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        The parts a small team uses every day. Each task has an owner, a priority, a status, from and to dates,
        labels, a checklist and notes. My tasks lists everything assigned to you across every board, and each board
        has search and filters. A task can depend on another task on the same card, and record what it is waiting for, what it blocks,
        and the next action, so a{" "}
        <Link
          href="/task-dependencies"
          className="text-accent-soft underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          blocked task says why
        </Link>
        . The{" "}
        <Link href="/gantt" className="text-accent-soft underline decoration-white/20 underline-offset-2 hover:text-white">
          timeline
        </Link>{" "}
        is a Gantt chart of the board, grouped by task or by person, with overdue work marked in red.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        Sharing is one invite link per board. People sign in with Google, join the board, and edit the tasks they added or that are assigned to them.
        Each task has comments and a history of who changed what. Assignments, replies and due-date reminders show up as notices in the app, and as push notifications if they turn those on.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">When Asana is the better choice</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/70">
        <li>You manage many projects across departments and need portfolios, goals or workload reporting.</li>
        <li>You need intake forms, approvals, rules or integrations with the rest of your tools.</li>
        <li>You need nested subtasks and file attachments on tasks.</li>
        <li>Your team needs admin controls and sign-in other than Google.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        TaskOrb does none of those. It is for a person or a small team that wants to see who owns what and what is
        stuck, without running a project-management system.
      </p>

      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">Getting started</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        There is no importer. Start from a{" "}
        <Link href="/templates" className="text-accent-soft underline decoration-white/20 underline-offset-2 hover:text-white">
          template
        </Link>{" "}
        such as a product launch or client onboarding plan, which comes with dated tasks and dependencies already in
        place. Then add your people and share the invite link.
      </p>

      <RelatedGuides current="/asana-alternative" />
      <SignInPrompt>
        Sign in with Google and your first boards are ready. It is free, and nothing is shared until you send a link.
      </SignInPrompt>
    </article>
  );
}
