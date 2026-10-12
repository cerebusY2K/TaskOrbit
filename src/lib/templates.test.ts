import { describe, expect, it } from "vitest";
import { BOARD_TEMPLATES, shiftISO, TEMPLATE_GROUPS } from "./templates";

describe("board templates", () => {
  it("have unique slugs and only depend on earlier tasks on the same card", () => {
    const slugs = BOARD_TEMPLATES.map((template) => template.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const template of BOARD_TEMPLATES) {
      for (const card of template.cards) {
        card.tasks.forEach((task, index) => {
          if (task.dependsOn) {
            expect(card.tasks.slice(0, index).map((other) => other.name)).toContain(task.dependsOn);
          }
          if (task.start !== undefined && task.due !== undefined) expect(task.due).toBeGreaterThanOrEqual(task.start);
        });
      }
    }
  });

  it("puts every template in exactly one group", () => {
    const grouped = TEMPLATE_GROUPS.flatMap((group) => group.slugs);
    expect([...grouped].sort()).toEqual(BOARD_TEMPLATES.map((template) => template.slug).sort());
  });

  it("shifts days across month ends", () => {
    expect(shiftISO("2026-10-30", 3)).toBe("2026-11-02");
    expect(shiftISO("2026-12-31", 1)).toBe("2027-01-01");
  });
});
