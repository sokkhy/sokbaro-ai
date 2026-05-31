// One-time camera-permission grant page. getUserMedia can't prompt from the
// invisible offscreen document, so we trigger the prompt here (a visible page);
// once granted, the permission persists for the extension origin.

const statusEl = document.getElementById("status")!;

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    stream.getTracks().forEach((t) => t.stop());
    statusEl.textContent = "Camera enabled. You can close this tab.";
    chrome.runtime.sendMessage({ type: "CAMERA_GRANTED" });
    setTimeout(() => window.close(), 800);
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : "Permission denied.";
    statusEl.textContent = `Camera access denied: ${message}`;
    chrome.runtime.sendMessage({ type: "CAMERA_DENIED", message });
  });
