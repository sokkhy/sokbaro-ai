// Service worker: coordinates the popup, the offscreen detection document,
// the camera-permission page, and the content-script banner.

import {
  OFFSCREEN_PATH,
  PERMISSION_PATH,
  type Message,
  type Phase,
  type PostureState,
} from "./messages";
import type { PostureStatus } from "@/lib/pose/types";

const DEFAULT_STATE: PostureState = {
  monitoring: false,
  phase: "idle",
  score: 100,
  status: "good",
};

// --- state (persisted to session storage so the popup survives SW restarts) ---

async function getState(): Promise<PostureState> {
  const { state } = await chrome.storage.session.get("state");
  return { ...DEFAULT_STATE, ...(state as Partial<PostureState> | undefined) };
}

async function setState(patch: Partial<PostureState>): Promise<PostureState> {
  const next = { ...(await getState()), ...patch };
  await chrome.storage.session.set({ state: next });
  return next;
}

// --- badge ---

function updateBadge(state: PostureState) {
  if (!state.monitoring) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  if (state.phase === "calibrating" || state.phase === "initializing") {
    chrome.action.setBadgeText({ text: "CAL" });
    chrome.action.setBadgeBackgroundColor({ color: "#0ea5e9" });
    return;
  }
  chrome.action.setBadgeText({ text: String(state.score) });
  chrome.action.setBadgeBackgroundColor({
    color: state.status === "good" ? "#10b981" : "#ef4444",
  });
}

// --- offscreen lifecycle ---

function startOffscreen() {
  // Send exactly once. The offscreen's start() is idempotent, but duplicate
  // sends still cause churn — the offscreen announces OFFSCREEN_READY when its
  // listener is attached, so a single message is reliable.
  chrome.runtime.sendMessage({ type: "OFFSCREEN_START" }).catch(() => {});
}

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) {
    startOffscreen();
    return;
  }
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: "Analyze webcam posture locally in the background.",
  });
  // A freshly created doc starts itself via OFFSCREEN_READY (handled below) —
  // don't also send OFFSCREEN_START here, or two start()s race over the camera.
}

async function closeOffscreen() {
  chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP" }).catch(() => {});
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

// --- content-script banner (active tab only) ---

async function sendToActiveTab(message: Message) {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (!tab?.id) return;
  // chrome:// and other restricted pages have no content script; ignore failures.
  chrome.tabs.sendMessage(tab.id, message).catch(() => {});
}

// --- start / stop ---

async function startMonitoring() {
  const { cameraGranted } = await chrome.storage.local.get("cameraGranted");
  if (!cameraGranted) {
    // Camera can't be prompted from the invisible offscreen doc — grant it
    // from a visible page first. We resume on the CAMERA_GRANTED message.
    await chrome.tabs.create({ url: chrome.runtime.getURL(PERMISSION_PATH) });
    return;
  }
  const state = await setState({
    monitoring: true,
    phase: "initializing",
    error: undefined,
  });
  updateBadge(state);
  await ensureOffscreen();
}

async function stopMonitoring() {
  const state = await setState({ monitoring: false, phase: "idle" });
  updateBadge(state);
  await closeOffscreen();
  sendToActiveTab({ type: "HIDE_BANNER" });
}

// --- message routing ---

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  switch (msg.type) {
    case "START":
      startMonitoring();
      break;
    case "STOP":
      stopMonitoring();
      break;
    case "GET_STATE":
      getState().then(sendResponse);
      return true; // async response
    case "CAMERA_GRANTED":
      chrome.storage.local.set({ cameraGranted: true }).then(startMonitoring);
      break;
    case "CAMERA_DENIED":
      setState({ monitoring: false, phase: "error" }).then(updateBadge);
      break;
    case "OFFSCREEN_READY":
      // Offscreen just loaded; start it if the user wants monitoring on.
      getState().then((state) => {
        if (state.monitoring) startOffscreen();
      });
      break;
    case "STATUS":
      handleStatus(msg.phase, msg.score, msg.status);
      break;
    case "ALERT":
      sendToActiveTab({
        type: "SHOW_BANNER",
        message: msg.message,
        variant: msg.variant ?? "alert",
      });
      break;
    case "ERROR":
      // Surface the real reason in the popup instead of silently stopping.
      setState({ monitoring: false, phase: "error", error: msg.message }).then(
        (state) => {
          updateBadge(state);
          closeOffscreen();
          sendToActiveTab({ type: "HIDE_BANNER" });
          if (msg.needsPermission) {
            // The "granted" flag was stale / never real — clear it and re-run
            // the visible grant flow so the user can actually click Allow.
            chrome.storage.local.remove("cameraGranted").then(() => {
              chrome.tabs.create({
                url: chrome.runtime.getURL(PERMISSION_PATH),
              });
            });
          }
        },
      );
      break;
  }
});

let prevPhase: Phase = "idle";

async function handleStatus(phase: Phase, score: number, status: PostureStatus) {
  const state = await setState({ phase, score, status, monitoring: true });
  updateBadge(state);

  // Announce calibration transitions via a brief banner (popup may be closed).
  if (phase === "calibrating" && prevPhase !== "calibrating") {
    sendToActiveTab({
      type: "SHOW_BANNER",
      message: "SokBaro: calibrating — sit up straight…",
      variant: "info",
    });
  } else if (phase === "monitoring" && prevPhase === "calibrating") {
    sendToActiveTab({
      type: "SHOW_BANNER",
      message: "SokBaro: monitoring your posture.",
      variant: "info",
    });
  }
  prevPhase = phase;
}

// Reset transient state when the service worker (re)starts.
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.session.set({ state: DEFAULT_STATE });
  chrome.action.setBadgeText({ text: "" });
});
