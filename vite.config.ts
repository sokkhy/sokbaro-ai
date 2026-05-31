import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { fileURLToPath } from "node:url";
import manifest from "./extension/manifest.config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Builds the SokBaro Chrome extension (MV3) into extension/dist.
// The Next.js web app is built separately via `next build`.
export default defineConfig({
  root: r("./extension"),
  // Reuse the web app's MediaPipe assets (public/wasm, public/models).
  publicDir: r("./public"),
  resolve: {
    alias: { "@": r("./") },
  },
  server: {
    // Allow importing the shared lib/ modules from outside the extension root.
    fs: { allow: [r("./")] },
  },
  plugins: [crx({ manifest })],
  build: {
    outDir: r("./extension/dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Extension pages not referenced from the manifest.
        offscreen: r("./extension/src/offscreen.html"),
        permission: r("./extension/src/permission.html"),
      },
    },
  },
});
