import type { BlogPost } from "../blog-types";

export const blockedVsOnHold: BlogPost = {
  slug: "blocked-vs-on-hold",
  title: "Blocked vs on hold: what's the difference and why it matters for your team",
  description:
    "Blocked means something else has to happen first. On hold means you paused this task, and why. How a small team keeps those two facts from blurring together.",
  published: "2026-10-08",
  cta: "Open a board and give one paused task a reason someone else could act on. Sign in with Google. It is free.",
  body: `
Ask a small team why a task has not moved and you will hear two answers that sound the same. "It's blocked." "It's on hold." They are not the same fact, and treating them as one is how work goes quiet without anyone deciding to pause it.

Blocked means something else has to happen before this task can move. On hold means you have chosen to stop, and you can say why. One is a condition. The other is a decision. A team that keeps them apart knows what to chase and what to leave alone until a date. A team that mixes them up builds a pile of stuck tasks that nobody owns, then wonders why the standup runs long and Thursday is still a surprise.

## What blocked actually describes

A task is blocked when progress depends on an event that is not this task. That event might be another task, or a person who will never have a login on your board.

The homepage cannot be built until the wireframe is approved. The proposal cannot go out until the client sends the logo. The client is not a task. Both are blocks, and neither is a decision to pause. When the wireframe is approved, or the logo arrives, the task is free. You were waiting on an input with a name.

The word "blocked" on its own tells the next person nothing. Write the input down:

- If another task on the same card has to finish first, that task is what this one **depends on**. A name you can point at is better than a sentence everyone interprets differently.
- If the input is a person, a file or a decision outside the card, name it under **waiting for**. "Client logo, promised Tuesday" is useful. "External dependency" means you have not written the email yet.
- If this task is holding other work, say so under **blocks**. The homepage blocks the launch email. The launch email is waiting on the homepage, and someone should be able to see that without a meeting.

A task can be in progress and still be waiting. You might be building the page while the headline is outstanding. Do not pause the whole task because one input is late, if the rest of it is honestly moving. Record the wait, and keep the status as in progress. Status answers "are we working on this?" Waiting for answers "what is still missing?" A board with room for only one of those will lie about the other.

## What on hold is for

On hold means someone decided this task will not move, for a reason that is still true tomorrow. The reason is the point. Without it, on hold is a drawer.

Good reasons sound like decisions a colleague can check later:

- The client is rewriting the offer, so the homepage waits until the new wording exists. Look again on the 20th.
- Sam is out until Thursday. Nobody else can pick up the illustrations, and starting them cold would waste the two days.
- The second case study waits until the first one is published. That is capacity, not a missing file. The file exists. The week does not.

Bad reasons repeat the status in different clothes: "blocked", "waiting", "TBD", "later". The next standup then has to rebuild the story from memory, which means the board failed at the only job it had.

On hold is also right when you could do the work and you are choosing not to. Nothing external is missing. The week is full, the goal changed, or a client asked you to stop. Calling that "blocked" blames a constraint you do not have, and it hides a choice the team should be able to reverse if Friday opens up.

## Why the split changes the week

Blocked work needs a chase. Someone has to get the input, or finish the predecessor. The next action points outward: send the email, book the call, finish the other task.

On-hold work needs a review date, not a daily nudge. Chasing a paused task trains people to ignore the board, because the board keeps crying wolf. The next action points inward: on this date, decide whether the pause is still right. If that date is missing, the pause is just a pile.

Mix the two and both habits break. People nag work that was deliberately paused, or they leave a genuinely stuck task alone because it looks like a decision someone already made. A client then thinks the studio vanished, when the studio was waiting on the client and never wrote that down.

There is a third state. The task is open, nobody has started, and nothing is missing except a person and a day. That is queued. Give it an owner and a date, or admit it is not happening this month. A queue with no owner fills the board with work nobody is doing.

## How a light board can hold both

You do not need a column called Blocked. A field on the task is enough, because it asks for a sentence.

[TaskOrb](/features) has four statuses: open, in progress, on hold and done. There is no blocked status. The block sits beside the status, so a task can be in progress and still name what it is waiting for. Depends on points at another task on the same card, or you choose Something else and type the blocker when it lives outside the board. Waiting for and blocks are short notes. The [dependencies guide](/task-dependencies) covers those fields, including the rule that a link cannot loop back on itself.

On hold asks for a reason before it will save. That reason shows up in the per-person summary on the [timeline](/gantt), beside the task name, so a glance at someone's week includes why a piece of work is paused.

A few limits are worth knowing so the board does not surprise you. Putting a task on hold does not move its dates. If the to date is this Friday, the task is still due this Friday. If that date passes and the task is not done, it is overdue, including while it is on hold. Overdue is calculated, not a status you pick. On the simple board the task is marked in red, and it shakes, until you set it to done. On the timeline the bar gets a red ring. The people summary names it under overdue and, separately, under on hold with the reason.

A pause does not pause the calendar. If the date is no longer a real promise, change the date. If the pause is over, take the task off hold.

## A Friday pass

Once a week, read every task that is on hold or that has something in Waiting for.

1. If the status is on hold, the reason should say what changed and when to look again. Rewrite "blocked" into a name and a date. If you cannot name a decision, it is probably waiting on an input, and the status should go back to open or in progress so someone still owns the chase.
2. If Waiting for is filled in and the status is in progress, check that the free part of the task is actually moving. A task that has sat still, with a wait written down and no next action, is often a pause you have not admitted.
3. If the to date is inside the next week and the task is paused, move the date or unpause it. Due-this-week still includes on-hold tasks, because the date is a promise and the status does not cancel it.
4. If Blocks names other work, those tasks should point back, at least in words. One-sided links are how a collision shows up in the launch week, when reordering is no longer calm.

Then look at the person. Two on-hold tasks with clear reasons are a week you can explain to a client. Five tasks that only say "blocked" are a person who is stuck, and a board that is helping them hide it. [Who is overloaded](/blog/whos-overloaded) is about reading that before the deadline week. [Tracking dependencies](/blog/track-task-dependencies) is about writing the input down while it is still fresh.

You will still say "blocked" out loud. That is a normal word. The board's job is the follow-up: blocked by what, and have we decided to pause, or are we still trying to move?
`,
};
