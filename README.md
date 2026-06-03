# SokBaro AI

> Sit Better. Work Better.

A privacy-first AI posture coach. SokBaro uses your webcam to monitor your
working posture in real time and nudges you to sit up straight — no wearables,
no extra hardware. **Your video never leaves the browser**; only posture scores
are saved.

The name combines **Sok (សុខ)** — health/wellness (Khmer) — and **Baro (바로)** —
straight/correct (Korean).

## Features (MVP)

- Real-time posture detection from the webcam (head, neck, shoulders, screen distance)
- Live 0–100 posture score with good/bad status and coaching hints
- Per-user calibration (sit normally for ~3s at the start of a session)
- Smart alert after **10 seconds** of sustained bad posture
- Break reminder after **50 minutes** of working
- Session summary + history dashboard (optional, via Firebase)

## Tech stack

- **Next.js 16** (App Router) · React 19 · TypeScript · Tailwind CSS v4
- **MediaPipe Tasks Vision** `PoseLandmarker` — runs fully locally (WASM), self-hosted
- **Firebase** (Firestore + Anonymous Auth) — optional, for posture history

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Start posture check**. Camera access works
on `localhost`; a production deploy needs HTTPS.

### Optional: enable history (Firebase)

History saving is off until Firebase is configured — the app works fully without it.

1. Create a Firebase project; enable **Firestore** and **Anonymous Authentication**.
2. Copy `.env.example` to `.env.local` and fill in the `NEXT_PUBLIC_FIREBASE_*` values.
3. Deploy the rules in `firestore.rules` (each user can only read/write their own sessions).
4. Create the composite index in `firestore.indexes.json` — the dashboard query
   (`where userId == … orderBy createdAt desc`) needs it. Either deploy it with the
   Firebase CLI, or just run the app once and follow the auto-generated index link
   Firestore prints in the console on the first dashboard load.

## Chrome extension (background monitoring)

The web app only monitors while its tab is focused. For **background monitoring while you
work in other tabs**, there's an MV3 Chrome extension under `extension/` that runs the camera
+ MediaPipe in an offscreen document and shows an alert **banner on whatever web page you're
viewing**.

```bash
npm run build:ext      # build to extension/dist
# then: chrome://extensions → enable Developer mode → Load unpacked → select extension/dist
npm run dev:ext        # rebuild on change (reload the extension in chrome://extensions)
```

Click the toolbar icon → **Start monitoring**. The first start opens a one-time page to grant
camera access (the invisible offscreen document can't prompt for it). After that, detection
runs in the background; slouching for ~10s shows a banner on the active tab, and the toolbar
badge shows your live score (green/red, or `CAL` while calibrating).

**Notes & limits:**
- The banner only renders on **Chrome web pages** — not over native apps (VS Code, Zoom, etc.).
  Detection still runs there; the toolbar badge reflects status. Desktop notifications/sound
  could cover that gap later.
- `<all_urls>` permission (needed to show the banner anywhere) triggers a broad install warning.
- Your **camera light stays on** the whole session. Video is processed locally and never uploaded.
- Shares the same pose logic as the web app (`lib/pose/*`) and the same MediaPipe assets.

## Scripts

```bash
npm run dev      # web app dev server
npm run build    # web app production build (also type-checks)
npm run build:ext# build the Chrome extension into extension/dist
npm run dev:ext  # rebuild the extension on change
npm run lint     # eslint
npm test         # vitest unit tests (scoring, alerts, calibration, breaks)
```

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md` before opening a pull request,
especially the privacy expectations around camera data and optional Firebase history.

## Project layout

- `lib/pose/` — pure posture logic: `scoring.ts`, `calibration.ts`, `alerts.ts`, `landmarks.ts` (+ tests)
- `lib/pose/poseLandmarker.ts` — browser-only MediaPipe setup (dynamic import)
- `hooks/usePoseDetection.ts` — webcam + rAF detection loop, throttled to ~10 fps
- `components/MonitorClient.tsx` — live monitoring UI
- `components/DashboardClient.tsx` — history dashboard
- `lib/firebase/` — Firebase client, anon auth, session read/write
- `public/models/`, `public/wasm/` — self-hosted MediaPipe assets

## Privacy

Camera frames are analyzed in the browser and discarded immediately. Only derived
numbers (average score, % good, alert count, timestamps) are ever stored.

## License

SokBaro AI is available under the MIT License. See `LICENSE`.
