// Content script: renders the SokBaro alert banner on the current web page.
// Uses a Shadow DOM so page styles can't interfere with (or leak into) it.

import type { BannerVariant, Message } from "./messages";

const AUTO_HIDE_MS = 6000;

let host: HTMLDivElement | null = null;
let shadow: ShadowRoot | null = null;
let bannerEl: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function ensureBanner() {
  if (host) return;
  host = document.createElement("div");
  host.id = "sokbaro-banner-host";
  host.style.cssText =
    "all: initial; position: fixed; top: 16px; left: 0; right: 0; z-index: 2147483647; display: flex; justify-content: center; pointer-events: none;";
  shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .banner {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      padding: 12px 20px;
      border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(-12px);
      transition: opacity .2s ease, transform .2s ease;
      max-width: 90vw;
    }
    .banner.show { opacity: 1; transform: translateY(0); }
    .banner.alert { background: #ef4444; }
    .banner.info  { background: #0ea5e9; }
  `;
  bannerEl = document.createElement("div");
  bannerEl.className = "banner";
  shadow.append(style, bannerEl);
  document.documentElement.appendChild(host);
}

function show(message: string, variant: BannerVariant) {
  ensureBanner();
  if (!bannerEl) return;
  bannerEl.textContent = message;
  bannerEl.className = `banner show ${variant}`;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(hide, AUTO_HIDE_MS);
}

function hide() {
  if (bannerEl) bannerEl.className = "banner";
}

chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.type === "SHOW_BANNER") show(msg.message, msg.variant);
  else if (msg.type === "HIDE_BANNER") hide();
});
