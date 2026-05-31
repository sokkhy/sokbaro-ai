// Diagnose the SokBaro extension headlessly: load it, fake the camera, trigger
// monitoring, and print every console line / error from the offscreen doc and
// service worker so we can see exactly where start() fails.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXT = resolve(__dirname, "../extension/dist");

const tag = (src) => `[${src}]`;
function wire(target, src) {
  target.on?.("console", (m) => console.log(tag(src), m.type(), m.text()));
  target.on?.("pageerror", (e) => console.log(tag(src), "PAGEERROR", e.message));
}

const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});

// Capture everything, including contexts created later (offscreen, permission).
ctx.on("page", (p) => wire(p, `page:${p.url().split("/").pop()}`));
ctx.on("serviceworker", (w) => wire(w, "sw"));

// Find the extension's service worker to learn the extension id.
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent("serviceworker", { timeout: 10000 });
wire(sw, "sw");
const extId = new URL(sw.url()).host;
console.log("EXTENSION ID:", extId);

// Open the popup page and click "Start monitoring" → sends START to background.
const popup = await ctx.newPage();
wire(popup, "popup");
await popup.goto(`chrome-extension://${extId}/src/popup.html`);
await popup.click("#toggle");
console.log(">>> clicked Start");

// Let the camera-grant tab → offscreen → start() flow play out.
await new Promise((r) => setTimeout(r, 8000));

// Report the final state the background holds.
const state = await sw.evaluate(async () => {
  const { state } = await chrome.storage.session.get("state");
  return state;
});
console.log("FINAL STATE:", JSON.stringify(state));

await ctx.close();
