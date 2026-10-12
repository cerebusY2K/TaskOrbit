import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEMES, themeBootScript, themeById } from "./themes";

describe("themes", () => {
  it("has unique ids, a default, and a CSS block for each theme", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
    expect(themeById(DEFAULT_THEME).id).toBe(DEFAULT_THEME);
    expect(themeById("nope").id).toBe(DEFAULT_THEME);
    for (const theme of THEMES) expect(css).toContain(`[data-theme="${theme.id}"]`);
  });

  it("only applies a saved theme it knows about", () => {
    const script = themeBootScript();
    expect(script).toContain('"taskorb-theme"');
    expect(script).toContain("hasOwnProperty.call(b,t)");
    expect(() => new Function(script)).not.toThrow();
  });
});
