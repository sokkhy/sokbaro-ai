# Contributing

Thanks for helping improve SokBaro AI.

## Development

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm test
npm run build
```

For Chrome extension changes, also run:

```bash
npm run build:ext
```

## Privacy expectations

SokBaro AI is designed so camera frames stay in the browser. Contributions must preserve that property unless a change is explicit, documented, and reviewed carefully.

- Do not upload raw camera frames, video, or images.
- Store only derived posture metrics needed for user-facing history.
- Keep Firebase history optional; the app should still work without environment variables.
- Avoid adding analytics or telemetry without a clear opt-in path.

## Pull requests

- Keep changes focused and explain user-visible behavior.
- Add or update tests for posture scoring, alerts, calibration, break timing, and shared logic.
- Include screenshots or short recordings for visible UI changes when useful.
- Document new environment variables in `.env.example` and `README.md`.
