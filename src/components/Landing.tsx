import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

const FEATURES = [
  {
    title: "Boards, cards and tasks",
    body: "Keep each project on its own board. Split it into cards for people, teams or workstreams, then add tasks with an owner, a priority and dates.",
    color: "#4d84ff",
  },
  {
    title: "See what is waiting on what",
    body: "Every task shows whether it is open, in progress, on hold or done, and overdue work turns red, so the blockers are obvious at a glance.",
    color: "#ff6b57",
  },
  {
    title: "Timeline and Gantt chart",
    body: "Switch any board to a timeline to plan start and due dates. Group the Gantt chart by task, or by person to see who is overloaded.",
    color: "#a970ff",
  },
  {
    title: "Share boards with your team",
    body: "Invite people by email. They sign in with Google, see only the boards you share, and get notified when a task is assigned to them.",
    color: "#22b07d",
  },
  {
    title: "An orbit view of your work",
    body: "Boards orbit your workspace and tasks orbit their cards. Hover to pause, click to open, or switch to the simple board view.",
    color: "#ffb547",
  },
  {
    title: "On your phone and your Mac",
    body: "TaskOrb runs in any browser, installs as an app on iPhone, Android and Mac, and sends push notifications when work moves to you.",
    color: "#6da2ff",
  },
];

const STEPS = [
  ["Sign in with Google", "No forms or passwords. Your first board is ready straight away."],
  ["Add cards and tasks", "Give each task an owner, a status and dates. Drag tasks between cards as work moves."],
  ["Invite your team", "Share a board by email and follow progress in orbit, board or timeline view."],
];

const FAQ = [
  [
    "What is TaskOrb?",
    "TaskOrb is a task board for individuals and small teams. It organises work into boards, cards and tasks, and makes it obvious what each task is waiting on.",
  ],
  ["Is TaskOrb free?", "Yes. You can sign in with a Google account and start using TaskOrb for free."],
  [
    "Can I see my tasks on a Gantt chart?",
    "Yes. Every board has a timeline view that draws tasks as a Gantt chart. You can group rows by task or by team member.",
  ],
  [
    "Who can see my boards?",
    "Only you. A board becomes visible to someone else only after you invite them to it, and you can remove them at any time.",
  ],
  [
    "Does TaskOrb work on my phone?",
    "Yes. Open taskorb.app on iPhone or Android and add it to your home screen, or use the Mac app on your computer.",
  ],
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "TaskOrb",
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "SoftwareApplication",
      name: "TaskOrb",
      url: `${SITE_URL}/`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android, macOS",
      description: SITE_DESCRIPTION,
      image: `${SITE_URL}/opengraph-image.png`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

export function Landing() {
  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section id="features" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-20">
        <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-[#6da2ff]">Task boards, in orbit</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          A task manager that shows what every task is waiting on
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-white/65">
          TaskOrb keeps your projects, people and deadlines in one place. Plan the work, share it with your team, and
          spot what is blocked before it slips.
        </p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="glass-panel rounded-2xl p-6">
              <span
                className="block h-3 w-3 rounded-full"
                style={{ background: feature.color, boxShadow: `0 0 16px ${feature.color}` }}
              />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">Start in under a minute</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map(([title, body], index) => (
            <li key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4d84ff]/20 text-sm font-semibold text-[#9dbcff]">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-white/65">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">Questions</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                <h3>{question}</h3>
                <span className="text-white/50 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 pt-8 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Put every task in orbit</h2>
        <p className="mt-3 text-white/65">Free to use. Sign in with Google and your first board is ready.</p>
        <a
          href="#top"
          className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1430] shadow-[0_8px_30px_rgba(77,132,255,0.35)] transition hover:bg-[#eef3ff]"
        >
          Get started
        </a>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-white/45">
        © {new Date().getFullYear()} TaskOrb · <a href={SITE_URL} className="hover:text-white">taskorb.app</a>
      </footer>
    </div>
  );
}
