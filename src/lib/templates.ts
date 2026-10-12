import type { Priority } from "./types";

export type TemplateTask = {
  name: string;
  /** Days from the day the board is created. */
  start?: number;
  due?: number;
  priority?: Priority;
  /** Name of an earlier task on the same card. */
  dependsOn?: string;
  waitingFor?: string;
  nextAction?: string;
};

export type TemplateCard = { name: string; color: string; tasks: TemplateTask[] };

export type BoardTemplate = {
  slug: string;
  name: string;
  title: string;
  description: string;
  intro: string;
  bestFor: string[];
  color: string;
  cards: TemplateCard[];
};

export const BOARD_TEMPLATES: readonly BoardTemplate[] = [
  {
    slug: "product-launch",
    name: "Product launch",
    title: "Free product launch plan template",
    description:
      "A free product launch task board: product, engineering, marketing and support tasks with dates, owners and dependencies, ready to use in TaskOrb.",
    intro:
      "Launches slip when one team is quietly waiting on another. This board splits a launch into the four groups that usually ship it and spreads the work over about four weeks, with the hand-offs written on each task.",
    bestFor: ["A feature or product release", "A small team where one person wears several hats", "Launch weeks you want on a Gantt chart"],
    color: "#4c7dff",
    cards: [
      {
        name: "Product",
        color: "#2c4f8f",
        tasks: [
          { name: "Lock the launch scope", start: 0, due: 2, priority: "high" },
          { name: "Pick the launch date", start: 2, due: 3, priority: "high", dependsOn: "Lock the launch scope" },
          { name: "Write the release notes", start: 10, due: 14, dependsOn: "Lock the launch scope" },
        ],
      },
      {
        name: "Engineering",
        color: "#0f6e6e",
        tasks: [
          { name: "Feature freeze", start: 0, due: 12, priority: "high" },
          { name: "QA pass on staging", start: 12, due: 17, priority: "high", dependsOn: "Feature freeze" },
          { name: "Deploy to production", start: 20, due: 20, priority: "urgent", dependsOn: "QA pass on staging" },
        ],
      },
      {
        name: "Marketing",
        color: "#c4553a",
        tasks: [
          { name: "Landing page copy", start: 5, due: 12 },
          { name: "Launch email", start: 14, due: 19, waitingFor: "Release notes from Product" },
          { name: "Social posts and demo video", start: 14, due: 20 },
        ],
      },
      {
        name: "Support",
        color: "#2f6b45",
        tasks: [
          { name: "Update help articles", start: 14, due: 19, waitingFor: "Release notes from Product" },
          { name: "Brief the support team", start: 19, due: 20, dependsOn: "Update help articles" },
          { name: "Watch feedback for a week after launch", start: 20, due: 27 },
        ],
      },
    ],
  },
  {
    slug: "event-planning",
    name: "Event planning",
    title: "Free event planning checklist template",
    description:
      "A free event planning checklist as a task board: venue, programme, promotion and on-the-day tasks with dates and dependencies, ready to use in TaskOrb.",
    intro:
      "Meetups, workshops and offsites all need the same few things done in the right order. This board covers six weeks before the day, from booking the venue to sending the thank-you email.",
    bestFor: ["Meetups, workshops and conferences", "Team offsites", "Anyone organising with a few volunteers"],
    color: "#ff9f43",
    cards: [
      {
        name: "Venue and logistics",
        color: "#c4882a",
        tasks: [
          { name: "Set the budget", start: 0, due: 3, priority: "high" },
          { name: "Book the venue", start: 3, due: 10, priority: "high", dependsOn: "Set the budget" },
          { name: "Order catering", start: 28, due: 35, dependsOn: "Book the venue", waitingFor: "Final head count" },
          { name: "Check AV and Wi-Fi at the venue", start: 35, due: 38, dependsOn: "Book the venue" },
        ],
      },
      {
        name: "Programme",
        color: "#6d4c8a",
        tasks: [
          { name: "Confirm speakers", start: 0, due: 14, priority: "high" },
          { name: "Publish the agenda", start: 14, due: 17, dependsOn: "Confirm speakers" },
          { name: "Collect slides", start: 30, due: 38, dependsOn: "Confirm speakers" },
        ],
      },
      {
        name: "Promotion",
        color: "#c4553a",
        tasks: [
          { name: "Open registrations", start: 10, due: 12, waitingFor: "Venue booking" },
          { name: "Announce on social and newsletters", start: 17, due: 30, dependsOn: "Open registrations" },
          { name: "Reminder email to attendees", start: 39, due: 40, dependsOn: "Open registrations" },
        ],
      },
      {
        name: "On the day",
        color: "#2f6b45",
        tasks: [
          { name: "Print badges and signs", start: 38, due: 40 },
          { name: "Run the event", start: 42, due: 42, priority: "urgent" },
          { name: "Send thank-you email and photos", start: 43, due: 45, dependsOn: "Run the event" },
        ],
      },
    ],
  },
  {
    slug: "hiring-pipeline",
    name: "Hiring pipeline",
    title: "Free hiring pipeline tracker template",
    description:
      "A free hiring pipeline tracker: role setup, sourcing, interviews and offer tasks on one board, with dates and dependencies, ready to use in TaskOrb.",
    intro:
      "Hiring stalls between steps: the job post waits on a salary band, the offer waits on references. This board lays out one role from job description to first day so you can see which step is holding things up.",
    bestFor: ["Founders hiring their first people", "Hiring managers without a recruiting tool", "One role at a time, with the panel on the board"],
    color: "#a970ff",
    cards: [
      {
        name: "Role setup",
        color: "#3e4c59",
        tasks: [
          { name: "Agree the salary band", start: 0, due: 3, priority: "high" },
          { name: "Write the job description", start: 0, due: 4 },
          { name: "Post the job", start: 5, due: 5, dependsOn: "Write the job description", waitingFor: "Salary band sign-off" },
        ],
      },
      {
        name: "Sourcing",
        color: "#c4882a",
        tasks: [
          { name: "Ask the team for referrals", start: 5, due: 12 },
          { name: "Review applications", start: 6, due: 20, nextAction: "Shortlist five people for screening" },
        ],
      },
      {
        name: "Interviews",
        color: "#2c4f8f",
        tasks: [
          { name: "Screening calls", start: 12, due: 22 },
          { name: "Skills interview", start: 18, due: 28, dependsOn: "Screening calls" },
          { name: "Final interview", start: 25, due: 32, priority: "high", dependsOn: "Skills interview" },
        ],
      },
      {
        name: "Offer",
        color: "#2f6b45",
        tasks: [
          { name: "Reference checks", start: 32, due: 36 },
          { name: "Send the offer", start: 36, due: 37, priority: "urgent", dependsOn: "Reference checks" },
          { name: "Plan the first week", start: 37, due: 45, dependsOn: "Send the offer" },
        ],
      },
    ],
  },
  {
    slug: "client-onboarding",
    name: "Client onboarding",
    title: "Free client onboarding checklist template",
    description:
      "A free client onboarding checklist for agencies and freelancers: kick-off, setup, delivery and handover tasks with dates and dependencies, in TaskOrb.",
    intro:
      "The first two weeks with a new client set the tone. This board covers contract to first check-in, and the Waiting for field shows which items are on the client's side.",
    bestFor: ["Agencies and studios", "Freelancers and consultants", "Sharing the plan with the client by inviting them to the board"],
    color: "#22b07d",
    cards: [
      {
        name: "Kick-off",
        color: "#0f6e6e",
        tasks: [
          { name: "Send the contract and invoice", start: 0, due: 1, priority: "high" },
          { name: "Kick-off call", start: 2, due: 3, priority: "high", dependsOn: "Send the contract and invoice" },
          { name: "Share the project plan", start: 3, due: 4, dependsOn: "Kick-off call" },
        ],
      },
      {
        name: "Setup",
        color: "#6d4c8a",
        tasks: [
          { name: "Collect logins and brand assets", start: 1, due: 5, waitingFor: "Client" },
          { name: "Set up shared folders and channels", start: 2, due: 4 },
          { name: "Agree a weekly check-in time", start: 3, due: 4 },
        ],
      },
      {
        name: "First delivery",
        color: "#c4553a",
        tasks: [
          { name: "First draft", start: 5, due: 10, priority: "high", waitingFor: "Logins and brand assets" },
          { name: "Client review", start: 10, due: 12, dependsOn: "First draft", waitingFor: "Client feedback" },
          { name: "Revisions", start: 12, due: 14, dependsOn: "Client review" },
        ],
      },
      {
        name: "Handover",
        color: "#2f6b45",
        tasks: [
          { name: "Hand over files and access", start: 14, due: 15 },
          { name: "Two-week check-in", start: 28, due: 28 },
        ],
      },
    ],
  },
  {
    slug: "sprint-planning",
    name: "Two-week sprint",
    title: "Free sprint planning board template",
    description:
      "A free two-week sprint board for small software teams: planning, build, review and release tasks with dates and dependencies, ready to use in TaskOrb.",
    intro:
      "A sprint goes wrong in the middle, when a ticket waits on a review nobody knew about. This board runs one two-week sprint from planning to retro, with the hand-offs between build, review and release written down.",
    bestFor: ["Small product and engineering teams", "Teams trying sprints without a heavy tool", "Seeing the sprint as a timeline instead of a list"],
    color: "#2bb5c9",
    cards: [
      {
        name: "Planning",
        color: "#2c4f8f",
        tasks: [
          { name: "Groom the backlog", start: 0, due: 0, priority: "high" },
          { name: "Agree the sprint goal", start: 0, due: 1, priority: "high", dependsOn: "Groom the backlog" },
          { name: "Estimate and assign tickets", start: 1, due: 1, dependsOn: "Agree the sprint goal" },
        ],
      },
      {
        name: "Build",
        color: "#0f6e6e",
        tasks: [
          { name: "Main feature work", start: 1, due: 8, priority: "high" },
          { name: "Fix the bugs carried over", start: 1, due: 5 },
          { name: "Write tests for the new work", start: 5, due: 9, dependsOn: "Main feature work" },
        ],
      },
      {
        name: "Review",
        color: "#6d4c8a",
        tasks: [
          { name: "Code review", start: 6, due: 10, waitingFor: "Pull requests from Build" },
          { name: "QA on staging", start: 9, due: 11, priority: "high", dependsOn: "Code review" },
          { name: "Demo to stakeholders", start: 12, due: 12, dependsOn: "QA on staging" },
        ],
      },
      {
        name: "Release",
        color: "#2f6b45",
        tasks: [
          { name: "Write the changelog", start: 11, due: 12 },
          { name: "Release to production", start: 13, due: 13, priority: "urgent", waitingFor: "QA sign-off" },
          { name: "Sprint retro", start: 13, due: 13, nextAction: "Bring one thing to keep and one to change" },
        ],
      },
    ],
  },
  {
    slug: "content-calendar",
    name: "Content calendar",
    title: "Free content calendar template",
    description:
      "A free content calendar for a month of blog posts, newsletters and social media: ideas, writing, design and publishing tasks with dates, in TaskOrb.",
    intro:
      "Publishing on a schedule means the draft, the image and the review all have to land before the post date. This board plans one month of content, so you can see which pieces are waiting on writing, design or sign-off.",
    bestFor: ["Founders and marketers posting every week", "Small content teams with a designer", "Planning a month at a time on the calendar view"],
    color: "#ff5c8a",
    cards: [
      {
        name: "Ideas",
        color: "#c4882a",
        tasks: [
          { name: "Pick this month's themes", start: 0, due: 2, priority: "high" },
          { name: "Keyword and topic research", start: 1, due: 4, dependsOn: "Pick this month's themes" },
          { name: "Assign writers and dates", start: 4, due: 5, dependsOn: "Keyword and topic research" },
        ],
      },
      {
        name: "Writing",
        color: "#2c4f8f",
        tasks: [
          { name: "Blog post 1", start: 5, due: 9 },
          { name: "Blog post 2", start: 12, due: 16 },
          { name: "Monthly newsletter", start: 20, due: 24, waitingFor: "Links to both blog posts" },
        ],
      },
      {
        name: "Design",
        color: "#8d3d55",
        tasks: [
          { name: "Header images for the posts", start: 8, due: 17, waitingFor: "Final post titles" },
          { name: "Social graphics for the month", start: 10, due: 20 },
        ],
      },
      {
        name: "Publish",
        color: "#2f6b45",
        tasks: [
          { name: "Publish blog post 1", start: 10, due: 10 },
          { name: "Publish blog post 2", start: 17, due: 17 },
          { name: "Send the newsletter", start: 25, due: 25, priority: "high" },
          { name: "Check what performed best", start: 28, due: 30, dependsOn: "Send the newsletter" },
        ],
      },
    ],
  },
  {
    slug: "marketing-campaign",
    name: "Marketing campaign",
    title: "Free marketing campaign plan template",
    description:
      "A free marketing campaign plan: strategy, assets, channels and reporting tasks with dates, owners and dependencies on one board, ready to use in TaskOrb.",
    intro:
      "Campaigns have a fixed launch date and a long list of assets that all need to be ready for it. This board works back from a launch about five weeks out, with the budget and brief approvals called out as blockers.",
    bestFor: ["A product, seasonal or event campaign", "Marketing teams of one to five", "Agencies running a campaign for a client"],
    color: "#ff9f43",
    cards: [
      {
        name: "Strategy",
        color: "#3e4c59",
        tasks: [
          { name: "Set the goal and target numbers", start: 0, due: 2, priority: "high" },
          { name: "Approve the budget", start: 2, due: 5, priority: "high", dependsOn: "Set the goal and target numbers" },
          { name: "Write the creative brief", start: 3, due: 7, dependsOn: "Set the goal and target numbers" },
        ],
      },
      {
        name: "Assets",
        color: "#8d3d55",
        tasks: [
          { name: "Key visual and ad creatives", start: 8, due: 18, waitingFor: "Approved creative brief" },
          { name: "Landing page", start: 10, due: 20, priority: "high" },
          { name: "Email sequence", start: 14, due: 22 },
        ],
      },
      {
        name: "Channels",
        color: "#c4553a",
        tasks: [
          { name: "Set up ad campaigns", start: 22, due: 26, waitingFor: "Budget approval and creatives" },
          { name: "Schedule social posts", start: 24, due: 28 },
          { name: "Campaign goes live", start: 30, due: 30, priority: "urgent" },
        ],
      },
      {
        name: "Reporting",
        color: "#2f6b45",
        tasks: [
          { name: "Set up tracking links and dashboard", start: 20, due: 26 },
          { name: "Week one results", start: 37, due: 37, dependsOn: "Set up tracking links and dashboard" },
          { name: "Campaign wrap-up report", start: 50, due: 52, dependsOn: "Week one results" },
        ],
      },
    ],
  },
  {
    slug: "employee-onboarding",
    name: "Employee onboarding",
    title: "Free employee onboarding checklist template",
    description:
      "A free employee onboarding checklist: paperwork, equipment, first-week and 30-day tasks for a new hire on one board, with dates and owners, in TaskOrb.",
    intro:
      "A new hire's first week depends on things that had to happen before they arrived: a laptop, accounts, a buddy. This board starts a week before day one and runs to the 30-day check-in, so nothing is left for the morning they turn up.",
    bestFor: ["Small companies without an HR system", "Managers onboarding a direct report", "Inviting the new hire to the board to tick things off"],
    color: "#22b07d",
    cards: [
      {
        name: "Before day one",
        color: "#3e4c59",
        tasks: [
          { name: "Send the welcome email", start: 0, due: 1, priority: "high" },
          { name: "Order the laptop and equipment", start: 0, due: 4, priority: "high" },
          { name: "Create email and tool accounts", start: 3, due: 6, waitingFor: "Signed contract from HR" },
          { name: "Pick an onboarding buddy", start: 0, due: 3 },
        ],
      },
      {
        name: "Paperwork",
        color: "#c4882a",
        tasks: [
          { name: "Signed contract", start: 0, due: 3, priority: "high" },
          { name: "Bank and tax details for payroll", start: 3, due: 9, dependsOn: "Signed contract" },
        ],
      },
      {
        name: "First week",
        color: "#2c4f8f",
        tasks: [
          { name: "Day one welcome and team lunch", start: 7, due: 7, priority: "high" },
          { name: "Walk through the tools and docs", start: 7, due: 8 },
          { name: "First small task shipped", start: 8, due: 11, dependsOn: "Walk through the tools and docs" },
        ],
      },
      {
        name: "First month",
        color: "#2f6b45",
        tasks: [
          { name: "Set 30-day goals together", start: 9, due: 11 },
          { name: "Weekly one-to-ones", start: 7, due: 35 },
          { name: "30-day check-in", start: 37, due: 37, dependsOn: "Set 30-day goals together" },
        ],
      },
    ],
  },
  {
    slug: "website-redesign",
    name: "Website redesign",
    title: "Free website redesign project plan template",
    description:
      "A free website redesign project plan: discovery, design, build and launch tasks with dates and dependencies, ready to use in TaskOrb for teams and agencies.",
    intro:
      "Redesigns run late when design waits on content and the build waits on design. This board plans a small site over about seven weeks and makes those waits visible, from the audit of the current site to the redirects after launch.",
    bestFor: ["Marketing sites with ten to thirty pages", "Agencies and freelancers", "In-house teams with one designer and one developer"],
    color: "#a970ff",
    cards: [
      {
        name: "Discovery",
        color: "#3e4c59",
        tasks: [
          { name: "Audit the current site and analytics", start: 0, due: 4, priority: "high" },
          { name: "Agree goals and the sitemap", start: 4, due: 7, dependsOn: "Audit the current site and analytics" },
        ],
      },
      {
        name: "Design",
        color: "#6d4c8a",
        tasks: [
          { name: "Wireframes for key pages", start: 7, due: 14, waitingFor: "Approved sitemap" },
          { name: "Visual design", start: 14, due: 24, priority: "high", dependsOn: "Wireframes for key pages" },
          { name: "Design sign-off", start: 24, due: 26, dependsOn: "Visual design" },
        ],
      },
      {
        name: "Content and build",
        color: "#0f6e6e",
        tasks: [
          { name: "Write and gather page content", start: 7, due: 28, waitingFor: "Copy from each team" },
          { name: "Build the templates", start: 26, due: 38, priority: "high", waitingFor: "Design sign-off" },
          { name: "Load content and test", start: 38, due: 44, dependsOn: "Build the templates" },
        ],
      },
      {
        name: "Launch",
        color: "#2f6b45",
        tasks: [
          { name: "Map redirects from old URLs", start: 36, due: 42 },
          { name: "Go live", start: 46, due: 46, priority: "urgent", waitingFor: "Content tested" },
          { name: "Check search console and fix broken links", start: 46, due: 53, dependsOn: "Go live" },
        ],
      },
    ],
  },
  {
    slug: "moving-house",
    name: "Moving house",
    title: "Free moving house checklist template",
    description:
      "A free moving house checklist as a task board: planning, packing, utilities and moving-day tasks over six weeks, with dates and dependencies, in TaskOrb.",
    intro:
      "Moving is a hundred small jobs with a hard deadline, and some of them, like the movers or the internet, need booking weeks ahead. This board starts six weeks out and covers the move and the first week in the new place.",
    bestFor: ["Anyone moving house or flat", "Couples and families splitting the jobs", "Sharing the plan by inviting the household to the board"],
    color: "#9ccc3c",
    cards: [
      {
        name: "Plan",
        color: "#2c4f8f",
        tasks: [
          { name: "Set the moving budget", start: 0, due: 3, priority: "high" },
          { name: "Get quotes and book movers", start: 2, due: 10, priority: "high", dependsOn: "Set the moving budget" },
          { name: "Give notice to the landlord", start: 0, due: 7 },
        ],
      },
      {
        name: "Pack",
        color: "#c4882a",
        tasks: [
          { name: "Declutter and donate", start: 7, due: 21 },
          { name: "Get boxes and tape", start: 14, due: 18 },
          { name: "Pack room by room", start: 21, due: 40, dependsOn: "Get boxes and tape" },
        ],
      },
      {
        name: "Admin and utilities",
        color: "#3e4c59",
        tasks: [
          { name: "Book internet at the new place", start: 7, due: 14, priority: "high" },
          { name: "Update address with bank and employer", start: 28, due: 40 },
          { name: "Final meter readings", start: 41, due: 42, waitingFor: "Moving day" },
        ],
      },
      {
        name: "Moving day and after",
        color: "#2f6b45",
        tasks: [
          { name: "Moving day", start: 42, due: 42, priority: "urgent", waitingFor: "Movers confirmed" },
          { name: "Unpack the essentials box", start: 42, due: 43, dependsOn: "Moving day" },
          { name: "Get the deposit back", start: 43, due: 56, dependsOn: "Moving day" },
        ],
      },
    ],
  },
];

export function boardTemplate(slug: string) {
  return BOARD_TEMPLATES.find((template) => template.slug === slug) ?? null;
}

export function templateTaskCount(template: BoardTemplate) {
  return template.cards.reduce((sum, card) => sum + card.tasks.length, 0);
}

export function templateSpanDays(template: BoardTemplate) {
  return Math.max(...template.cards.flatMap((card) => card.tasks.map((task) => task.due ?? task.start ?? 0))) + 1;
}

export function shiftISO(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
