import { execFileSync } from "child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url + "/../../package.json");
const sharp = require("sharp");

const svg = readFileSync("src/app/icon.svg");
const iconset = "desktop/build/AppIcon.iconset";
rmSync(iconset, { recursive: true, force: true });
mkdirSync(iconset, { recursive: true });

// macOS icons leave a transparent margin around the rounded square (824 of 1024).
async function icon(size) {
  const inner = Math.round(size * (824 / 1024));
  const art = await sharp(svg, { density: 1200 }).resize(inner, inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toBuffer();
}

for (const base of [16, 32, 128, 256, 512]) {
  writeFileSync(`${iconset}/icon_${base}x${base}.png`, await icon(base));
  writeFileSync(`${iconset}/icon_${base}x${base}@2x.png`, await icon(base * 2));
}
execFileSync("iconutil", ["-c", "icns", iconset, "-o", "desktop/AppIcon.icns"]);
console.log("desktop/AppIcon.icns written");
