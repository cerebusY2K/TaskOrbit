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
