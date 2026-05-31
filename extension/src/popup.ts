// Popup UI: Start/Stop and a live view of the current posture state.

import type { PostureState } from "./messages";

const scoreEl = document.getElementById("score")!;
const statusEl = document.getElementById("status")!;
const toggleEl = document.getElementById("toggle") as HTMLButtonElement;

function render(state: PostureState) {
  if (!state.monitoring) {
    scoreEl.textContent = "—";
    statusEl.textContent = "Not monitoring";
    statusEl.className = "status idle";
    toggleEl.textContent = "Start monitoring";
    toggleEl.className = "start";
    return;
  }

  toggleEl.textContent = "Stop monitoring";
  toggleEl.className = "stop";

  if (state.phase === "calibrating" || state.phase === "initializing") {
    scoreEl.textContent = "…";
    statusEl.textContent = "Calibrating — sit up straight";
    statusEl.className = "status info";
    return;
  }
  if (state.phase === "error") {
    scoreEl.textContent = "—";
    statusEl.textContent = state.error ?? "Camera unavailable";
    statusEl.className = "status bad";
    toggleEl.textContent = "Start monitoring";
    toggleEl.className = "start";
    return;
  }

  scoreEl.textContent = String(state.score);
  const good = state.status === "good";
  statusEl.textContent = good ? "Good posture" : "Fix your posture";
  statusEl.className = `status ${good ? "good" : "bad"}`;
}

async function refresh() {
  const state = (await chrome.runtime.sendMessage({
    type: "GET_STATE",
  })) as PostureState | undefined;
  if (state) render(state);
}

toggleEl.addEventListener("click", async () => {
  const state = (await chrome.runtime.sendMessage({
    type: "GET_STATE",
  })) as PostureState | undefined;
  chrome.runtime.sendMessage({ type: state?.monitoring ? "STOP" : "START" });
  // Give the background a moment, then reflect the new state.
  setTimeout(refresh, 300);
});

refresh();
// Keep the popup live while it's open.
const poll = setInterval(refresh, 1000);
window.addEventListener("unload", () => clearInterval(poll));
