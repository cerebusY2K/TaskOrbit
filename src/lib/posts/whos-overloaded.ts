import type { BlogPost } from "../blog-types";

export const whosOverloaded: BlogPost = {
  slug: "whos-overloaded",
  title: "How to see who's overloaded on your team before deadlines slip",
  description:
    "Use each person's dates, overdue tasks and on-hold reasons to see who is carrying too much, before the week of the deadline. A check for small teams.",
  published: "2026-10-12",
  cta: "Open a board and switch the timeline rows to Member. The people summary sits beside the chart. Sign in with Google.",
  body: `
Deadlines slip in small teams for a boring reason. The person who was going to finish the last three tasks was already full, and nobody looked at their week until the work was late. The task count looked fair. The days were not, and days are what a person has.

Overload is overlap plus a queue, not a long list. Twelve tasks in a neat sequence can be a calm month, because each one starts when the last one ends. Four tasks that all cover the same three days are not calm, even at medium priority. Add overdue work, undated tasks, and items on hold that still mean "this is mine", and you have what a headcount never shows.

## What to look at, in this order

Start with the person. A project view answers whether the launch is on track. A person view answers whether someone can do the days you just promised. The second question is the one that gets skipped, because the project view is what the client sees.

On a timeline grouped by person, each member has a row, including people added by name and email who have not opened the invite and still show as not joined. The row shows how many tasks they have and how many are overdue. Bars run from the from date to the to date. A task with only one of those dates sits on that single day. Overlapping bars stack in lanes instead of hiding each other. A stack means this person was booked twice for the same days, on purpose or by drift. That is the first conversation.

Then read the sentences beside the chart. For each person they say how many tasks are in progress, open, on hold and done. They name overdue tasks and the date they were due. They name what is being worked on now, what is due in the next seven days, and what is on hold, with the reason, so a pause is visible. They name tasks that still have no dates. The everyone view also names people who have no tasks yet, which is useful when you were sure the work was already spread.

Unassigned tasks get their own group. Work with nobody on it is not "the team's" in any way that helps. It lands on whoever notices, usually late. A name typed by hand, instead of picked from the people on the board, gets a group too. Add them properly so the row is a member you can invite. When those tasks have dates, they show on the chart as well.

A member with tasks but no dates still has a row. It says nothing is scheduled, and the count remains, so that work does not vanish.

## How to read a week that is already too full

Four patterns show up early. None of them needs a score.

Stacked days. Two or three bars on the same dates. Ask which bar can move, not how that person will work the weekend. Move a to date or an owner. The person who absorbs this week starts the next one behind. If the only row is you, the same rule applies.

Overdue work that is still open. If the to date is before today and the task is not done, it is overdue, whether the status is open, in progress or on hold. It shows in red on the board and as a red ring on the bar. Finish it, move the date to one you would say out loud, or pause it and write why.

A cluster due in the next seven days, on top of work already in progress. On-hold tasks still appear in that window when their date falls inside it. Pausing the status does not pause the date. If the pause is real, move the date. If the date is the promise, plan to take the task off hold before that day.

No dates. The chart cannot draw them, so the written list matters. Undated work is a promise you have not scheduled. Date it this month, or take it off the board.

On hold with a soft reason. "Waiting" and "blocked" do not say whether the load is still on this person. "Client rewriting the offer, look again on the 20th" means the days before the 20th are free. "Blocked" means you should treat the task as still theirs until the words improve. That difference is the subject of [blocked versus on hold](/blog/blocked-vs-on-hold).

Priority is separate. Low, medium, high and urgent sit on the task, and the summary only counts. Two urgent bars on the same days are worse than the stack suggests. Read the priority when you choose what to move.

## What this view will not decide

A person summary will not reassign work. Moving a task is a short conversation about which date is soft, who has the skill, and what was promised. Handing overflow to whoever looks empty also hands it to someone who is away, or whose real work is on another board.

The summary is one board at a time. Someone who looks calm on one client may be stacked on another. There is no merged view across every board. If you run several clients, check each board that has a deadline this month. Some studios also keep one internal board for the shared week. Either way, one client board is not the whole company.

Favours that live only in chat never appear, so the chart can look calm while someone is underwater. Put those tasks on the board, or stop offering them.

People who have not joined can still be assigned, and they still have a row. They cannot see it until they open the invite. Add them by name and email, copy the board's invite link, and send it yourself. TaskOrb does not email the link. After they join with Google, assigning a task leaves a notice in the app, and a push if they turned notifications on.

## A Monday check

Fifteen minutes is enough when the dates exist. If they do not, the first Monday is for putting dates on the work that is really happening.

1. Open the board, switch to Timeline, and set the rows to Member. Task rows are for sequence, which is what the [simple Gantt chart](/blog/simple-gantt-chart) guide is about. This check is about load, so the rows have to be people.
2. Read the everyone summary first. How many tasks are still open, how many are overdue, how many have no owner. Name an owner for anything unassigned before you get clever with dates.
3. For anyone with a stack, an overdue task, or a cluster due this week, open those tasks. Change an owner, change a date, or put the work on hold with a reason a stranger could use next Friday. If the slip is a missing input, write what the task is [waiting on](/task-dependencies), so the next reader does not treat a missing file as a motivation problem.
4. Copy the summary if you need the same words in a standup or a note. Memory will soften the overdue list. Then stop. Do not add a score, a colour scale, or a spreadsheet tab called Capacity.

Click a person's name to focus the chart on their tasks while you edit. Choose Everyone to see the whole board again. That focus lasts for this visit, on your screen.

## Show the rows to the people on them

The people named on the rows should open the same board. They will catch a task placed on a day they had already promised, and the favour that never became a card.

The [timeline](/gantt) and the people summary are on every board, next to the orbit and the simple board, because they are the same tasks. Nothing extra to install, and no paid plan that unlocks the person rows. The rest of the [task board](/features) is what makes the picture true: an owner, from and to dates, a status, and a waiting-for line. A [template](/templates) is a fair start when the board is empty, if you replace the sample tasks before you trust a row.

Look on Monday. Move one thing that is actually in conflict. The deadline week is quieter when the clash was visible ten days earlier, and the person who would have absorbed it had a chance to say so.
`,
};
