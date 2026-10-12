import type { BlogPost } from "../blog-types";

export const simpleGanttChart: BlogPost = {
  slug: "simple-gantt-chart",
  title: "A simple Gantt chart for small teams: when you need one and how to keep it light",
  description:
    "When a small team actually needs a Gantt chart, which dates to put on it, and how to keep the chart to one board instead of a second plan.",
  published: "2026-10-10",
  cta: "Open a board and switch to Timeline. Add a from date and a to date to place a task on the chart. Sign in with Google.",
  body: `
A Gantt chart has a reputation it does not deserve in a small team. People picture a wall of bars, a project manager who owns the file, and a schedule that is wrong before the meeting ends. Used like that, a team of five is right to avoid it.

Used as a picture of dates you already believe, it is a calendar: one row per piece of work, or one row per person. You need that picture in a few situations. You do not need it as a second system someone has to feed.

## When a chart earns its place

You need a simple Gantt chart when three things are true together. If one is missing, a list is enough, and bars only add a place to forget.

The work spans more than a week. Due dates are enough when everything happens by Friday. They hide the gap when a draft starts on Monday and the review cannot start until the following Wednesday, with someone away in between. The gap is the information.

More than one person is involved. A freelancer alone can feel a clash in their own week. The clash goes invisible when a designer and a developer both believe the same three days are free, because each is reading a private list.

Two tasks overlap, or one cannot start until another ends. If every task is short and independent, columns on a board answer the real question, which is what is in progress. Bars would only repeat the list.

You will feel it when two launches sit a week apart and one person cannot be in both on Wednesday, or the week a freelancer takes on a collaborator. Before that, a dated list is enough.

## What light means

A light chart has one bar per task you will stand behind, from a start date to an end date. The row is the task, grouped with the other tasks on that card, or the person who owns it. The unit is a day. Shade the weekends so a Friday-to-Monday bar does not look like three working days. Mark today, so past and future separate themselves.

That is the instrument. If a new teammate needs a training session to read the next two weeks, it is not light.

It does not need hours. Small-team work slips by days. It does not need a saved baseline, or percent complete. A task is open, in progress, on hold or done, and "60 percent" has no test. It does not move later dates for you when something slips. You move them, because you know whether the slip is real.

Automatic rescheduling feels helpful until it pushes a launch by two weeks because someone linked the wrong predecessor. On a small team, moving a date should be a decision you notice while you make it.

## Which tasks belong on it

Put a task on the chart when someone else needs to see its span. Leave it off when the date would be a guess you would not defend in a standup.

Both a from date and a to date make a bar between those days. One date makes a single day, which still says "this happens on Thursday" without inventing a duration. Neither date should stay visible as unscheduled work, not vanish. Undated tasks are where overload hides: absent from the picture, present in someone's head. List them under the chart. Then either date them or call them backlog and stop implying they happen this month.

Chart the thing a person owns across days. "Design the homepage" is a bar. "Export the SVG" is a next action on that task. The moment there is a row per email, people stop opening the chart, because updating it feels like a fine for having planned.

Colour bars by status, so a paused task does not look like active work from across the room. Mark overdue work, so a bar that ended last Tuesday is not mistaken for the plan. Clicking a bar should open the task. A chart you cannot edit is a poster.

## Group by the work, then by the person

Read the chart twice. One grouping hides what the other shows.

Grouped by task, under the card, you see whether one stream holds together. The launch card shows draft, review, then publish, in date order. You notice a gap, or a review that starts before the draft ends. This is the view for "does the project make sense?", and it is the view to show a client, because the rows are the work rather than your staffing.

Grouped by person, you see a week someone can actually live. Each member gets a row, including someone added by name and email who has not opened the invite yet. Tasks with no owner, and names typed in rather than picked from the people on the board, show up when they have dates. Overlapping tasks stack in lanes instead of covering each other. Three bars stacked on Wednesday is the conversation. One calm bar is not a problem, even if that person has a long list later in the month. Count is not load. Overlap is load.

The row should also say how many tasks they have and how many are overdue. Bars miss the undated queue. Counts miss the colliding days. The written summary next to the chart is the other half of the picture, and it is what [seeing who is overloaded](/blog/whos-overloaded) is about.

## What it will not do

Most Gantt failures in small companies are disappointed expectations.

It will not draw arrows between dependent tasks. Dependencies are a sentence on the task: what it depends on, what it is waiting for, what it blocks. Read them there. The habit is in [tracking dependencies](/blog/track-task-dependencies), and the fields are on the [task dependencies](/task-dependencies) page. Arrows look precise and go stale first, because an arrow is harder to update than a sentence and easier to trust after it is wrong.

It will not merge every board into one company plan. One board at a time is the light version: a client, a launch, or an event. A single view of five clients is a programme tool, or a Monday pass across those boards. A chart that tries to hold the whole agency becomes the file nobody updates, because it stopped being anyone's real workspace.

It will not replace the board. In [TaskOrb](/gantt) the timeline is another view of the same tasks, beside the orbit and the simple board. Change a date on the task and the bar moves. There is no second file, and the chart is part of the board rather than an add-on.

Dates are days, weekends are shaded, and a marker shows today. Status colours the bar. A task whose to date is before today, and that is not done, gets a red ring. Undated tasks are listed under the chart. Nothing moves by itself.

## Keep it true

Update the chart by updating the tasks, once a week, for about fifteen minutes. Monday is good because clashes can still move. Friday is good if clients decide things late. Pick one. A chart updated "when we remember" is six weeks old with today's name on it.

Open the board, switch to Timeline, and read the Task rows for sequence. Then switch the rows to Member and look for stacked days. If someone carries two bars across the same three days, move a date, move an owner, or put one task on hold with a reason a stranger could follow. Do not keep a spreadsheet called the real plan. The second plan wins every argument, and then both are wrong.

Starting from empty, a [template](/templates) such as the [product launch board](/templates/product-launch) or the [event plan](/templates/event-planning) already has dates and a few dependencies, counted from the day you create it. Delete what you do not need before anyone else sees it. Share the board's invite link with the people on the rows. A chart of work those people cannot open is a private worry, not a team plan.

The test: a new person can explain the next two weeks from the chart without you narrating. If they cannot, there are too many rows, or the dates are no longer true. Fix that before you add another field.
`,
};
