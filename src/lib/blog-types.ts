export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** ISO date, YYYY-MM-DD. */
  published: string;
  /** Shown under the sign-in button. The page heading is already "Open your board". */
  cta: string;
  /** Markdown subset. The page renders the title as the only H1, so the body starts at H2. */
  body: string;
};
