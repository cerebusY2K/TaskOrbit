import type { BlogPost } from "./blog-types";
import { blockedVsOnHold } from "./posts/blocked-vs-on-hold";
import { simpleGanttChart } from "./posts/simple-gantt-chart";
import { trackTaskDependencies } from "./posts/track-task-dependencies";
import { whosOverloaded } from "./posts/whos-overloaded";

export const BLOG_POSTS: readonly BlogPost[] = [
  trackTaskDependencies,
  blockedVsOnHold,
  simpleGanttChart,
  whosOverloaded,
];
