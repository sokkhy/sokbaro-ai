import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "SokBaro AI — Posture Coach",
  version: "0.1.0",
  description:
    "Background posture monitoring with on-screen alerts. Sit better, work better.",
  action: {
    default_popup: "src/popup.html",
    default_title: "SokBaro AI",
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  permissions: ["offscreen", "storage", "scripting", "tabs"],
  host_permissions: ["<all_urls>"],
  // MediaPipe compiles its vision WASM at runtime; MV3's default CSP
  // (script-src 'self') blocks that, so allow wasm-unsafe-eval.
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content.ts"],
      run_at: "document_idle",
      all_frames: false,
    },
  ],
  web_accessible_resources: [
    {
      // MediaPipe assets loaded by the offscreen document at runtime.
      resources: ["wasm/*", "models/*"],
      matches: ["<all_urls>"],
    },
  ],
});
