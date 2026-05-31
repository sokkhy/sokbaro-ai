import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const EXT = resolve(__dirname, "../extension/dist");
const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent("serviceworker", { timeout: 10000 });
const extId = new URL(sw.url()).host;
const p = await ctx.newPage();
p.on("console", (m) => console.log("popup", m.type(), m.text()));
p.on("pageerror", (e) => console.log("popup PAGEERROR", e.message));
await p.goto(`chrome-extension://${extId}/src/popup.html`);
await p.waitForTimeout(1000);
console.log("BUTTON TEXT:", await p.textContent("#toggle").catch(() => "MISSING"));
console.log("STATUS TEXT:", await p.textContent("#status").catch(() => "MISSING"));
await ctx.close();
