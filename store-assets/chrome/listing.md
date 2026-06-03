# Chrome Web Store Listing

## Name

SokBaro AI - Posture Coach

## Short description

Private, local posture monitoring with gentle alerts while you work.

## Detailed description

SokBaro AI is a privacy-first posture coach that monitors your sitting posture from your webcam and nudges you when you slouch or lean too close to the screen.

The Chrome extension keeps monitoring while you work in other tabs. It runs pose detection locally in the browser, shows a toolbar score, and displays an on-page alert banner after sustained poor posture.

Features:

- Real-time posture score from webcam pose detection
- Background monitoring with a Chrome MV3 offscreen document
- On-page alert banners after sustained poor posture
- Toolbar badge with live score and calibration state
- Local MediaPipe model and WASM assets
- No raw video upload

Privacy:

Camera frames are analyzed on your device and discarded immediately. SokBaro AI does not upload, sell, or share raw camera frames, images, or video.

## Category

Productivity

## Language

English

## Homepage URL

https://github.com/sokkhy/sokbaro-ai

## Privacy policy URL

Use the deployed app URL once available:

https://YOUR_DEPLOYED_DOMAIN/privacy

Temporary public source copy:

https://github.com/sokkhy/sokbaro-ai/blob/main/PRIVACY.md

## Permission justifications

### offscreen

Runs MediaPipe posture detection in an MV3 offscreen document while the extension is monitoring.

### storage

Stores local extension monitoring state and camera permission status.

### scripting

Injects the posture alert banner into the active page when sustained poor posture is detected.

### tabs

Finds the active tab so the extension can show posture alerts on the page the user is currently viewing.

### Host permission: all URLs

Allows posture alert banners to appear on the pages where the user is working. The extension does not collect browsing history, page contents, form data, passwords, or cookies.

## Privacy practices disclosure

Data collection: No raw camera frames, images, video, browsing history, page contents, form entries, passwords, or cookies are collected.

Data usage: Camera frames are processed locally to calculate derived posture status and are discarded immediately. Local extension state may be stored in Chrome extension storage.

Limited use certification: The extension uses data only to provide posture monitoring and alerts.
