import type { BlogPost } from "../blog-types";

export const trackTaskDependencies: BlogPost = {
  slug: "track-task-dependencies",
  title: "How to track task dependencies in a small team (without heavy project software)",
  description:
    "Write down what each task depends on, what it is waiting for, and what it blocks. A light method for small teams that does not need a full project suite.",
  published: "2026-10-06",
  cta: "Open a board and write what the next due task is waiting on. Sign in with Google. The board stays private until you share its invite link.",
  body: `
A small team rarely loses a week because the task list was incomplete. It loses the week because two people were waiting on the same thing, and the board still said in progress.

Heavy project software will draw arrows between every step and roll dates forward when one slips. A studio, a freelance practice with a collaborator, or an agency pod of four does not need that. It needs one honest sentence on each task that matters: what has to happen before this can move, and what this is holding up. Keep that sentence on the task.

## Write three facts, not a network diagram

Standups already contain the information. The designer is waiting on final copy. The developer is waiting on the design. The account lead is waiting on a client to approve a headline. In progress can be true for all three and still hide the chain.

Put it on the task, in three short fields:

- **Depends on** names another task that has to finish first, when you can point at that task.
- **Waiting for** names a person, file, decision or delivery that is not a task on this board. A client, a printer, a lawyer, a logo in someone else's inbox.
- **Blocks** names the work that cannot start, or cannot finish, until this task is done.

Add a next action when the task will sit for more than a day. Waiting for the logo is a fact. Email Priya and ask for the SVG by Wednesday is a next action. Teams that only record the wait repeat it, in the same words, at every standup.

Leave the fields empty on purpose when nothing is in the way. Empty should mean this can move, not that nobody filled the form in.

## Keep the predecessor on the same piece of work

A dependency is useful when the person doing the task will see it. A link into another project, in another tool, maintained by someone who does not open your board, is a rumour by Thursday.

Keep the predecessor and the successor on the same card when they belong to the same stream of work. A card might be a client, a launch, or a workstream. Send the announcement depends on Write the announcement because both live on the launch card. If the thing you need is not a task on that card, do not invent a placeholder somewhere else just so an arrow can exist. Write what you are waiting for. That limit stops the board turning into a map of the whole company, which is a map nobody maintains.

[TaskOrb](/task-dependencies) works this way. A task can depend on another task on the same card. The board refuses a link that would loop, including through a chain, and the message is "That would make a circular dependency." A task cannot depend on itself. If the blocker is not on the card, choose Something else and type it. The note stays as words. It is not a live link.

Drag a task onto a different card and a link to a task that stayed behind is kept as that task's name, so the history is not lost, but it is no longer a live link. You can only move a task to a card on the same board. The [timeline](/gantt) does not draw dependency arrows. Dates live on the chart. The reason a date might slip lives on the task. Open the task to read it.

## A client launch, written as four tasks

A three-person studio is shipping a small site next month. The card is the client. You do not need forty sub-steps. You need the hand-offs, because those are the places a small team gets surprised.

1. Collect the logo, copy and logins. Waiting for the client. Next action: send the checklist, and a date you will chase.
2. First draft. Depends on those assets. Starting the design before the logo exists means doing it twice, often in the week the launch was promised.
3. Client review. Depends on the first draft. Waiting for feedback. This is the step that goes quiet, and it is a different fact from an unfinished draft.
4. Publish. Depends on the review. Blocks the announcement, which may sit on another card. Write that in Blocks even when you cannot link across cards.

If the client goes silent, the review is the stuck task, not the draft. Put the review on hold and write a reason a colleague can act on. Status and dependency answer different questions. [Blocked and on hold](/blog/blocked-vs-on-hold) are not two words for the same pause.

The [client onboarding template](/templates/client-onboarding) and the [product launch template](/templates/product-launch) are already shaped like this: cards for the groups of work, dates counted from the day you create the board, and a few dependencies filled in. Delete what is not yours. A template is a sketch, not a process you have to adopt whole.

## Ten minutes, once a week

You do not need a dependency meeting. You need ten minutes on the board with the nearest deadline. For each task due in the next two weeks, check four things and then stop:

- It has an owner. Unassigned work lands on whoever notices it, usually late.
- It has a from date, a to date, or a conscious decision that it is unscheduled. An undated task disappears from a chart and stays in someone's head, which is an expensive place to keep a plan.
- If it cannot move today, Waiting for or Depends on says why, in words a new person could follow. "Blocked" is not a reason. "Waiting on Sam for the contract redlines" is, because someone can go and find Sam.
- If other tasks name it in Blocks, talk about it first, even when it looks small. A one-line approval holding up three people is the critical task. The long design task nobody is waiting on can slip a day.

Skip finished work, and skip a predecessor on a one-hour task that only you touch. A freelancer does not need one on sending an invoice. An agency owner does, if someone else is waiting on the client's approval. Skip percent complete and hour-by-hour plans too. A board full of those fields goes stale, and a stale board is worse than a notebook because people still trust it.

## Let the owners see the same sentence

A dependency with no owner is a fact about the work. A dependency with an owner is a fact about who will chase it. Share the board with the people who own the tasks, instead of pasting a status into chat and hoping the thread stays true.

In TaskOrb a board stays private until you share it. Add each person by name and email so you can assign them, then copy the board's invite link and send it yourself. The product does not email that link. Someone you have added who has not opened it still shows as not joined yet, and you can assign them tasks anyway. Once they have joined with Google, assigning a task leaves a notice in the app, and a push notification if they have turned notifications on. Push stays off until they do. On iPhone and iPad, push needs the app on the home screen.

## Start on the board you already have

Pick the live board with the nearest deadline. For every task due in the next fortnight, fill Waiting for or leave it knowingly blank. Link Depends on only where the predecessor is a real task on the same card. Write Blocks when someone else's work is stuck behind this one. Put a next action on anything that has been quiet for more than a couple of days. If you cannot name a next action, the task is probably paused, and the status should say so.

The same tasks are already visible as an orbit, as a simple board, or as a [timeline](/gantt). The dependency does not need its own screen. It needs to be on the task a person opens on a Tuesday afternoon. Owners, dates, status and notes are already part of the [task board](/features). Update the sentence when the facts change. That is the whole practice.
`,
};
