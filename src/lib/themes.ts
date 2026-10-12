export type Theme = {
  id: string;
  name: string;
  accent: string;
  background: string;
  light?: boolean;
};

export const THEMES: Theme[] = [
  { id: "midnight", name: "Midnight", accent: "#4d84ff", background: "#04060f" },
  { id: "aurora", name: "Aurora", accent: "#14aa82", background: "#020a0a" },
  { id: "nebula", name: "Nebula", accent: "#8b5cf6", background: "#070410" },
  { id: "ember", name: "Ember", accent: "#ea6c2c", background: "#0c0503" },
  { id: "rose", name: "Rose", accent: "#e14078", background: "#0c0308" },
  { id: "daylight", name: "Daylight", accent: "#3b66e6", background: "#f6f8fc", light: true },
];

export const DEFAULT_THEME = "midnight";
export const THEME_STORAGE_KEY = "taskorb-theme";

export function themeById(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!;
}

export function applyTheme(id: string) {
  const theme = themeById(id);
  document.documentElement.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.background);
}

/** Runs inline in <head> so the saved theme is in place before the first paint. */
export function themeBootScript() {
  const backgrounds = Object.fromEntries(THEMES.map((theme) => [theme.id, theme.background]));
  return `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var b=${JSON.stringify(backgrounds)};if(t&&Object.prototype.hasOwnProperty.call(b,t)){document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",b[t])}}catch(e){}`;
}
