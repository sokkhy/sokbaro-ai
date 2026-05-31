// Browser-only MediaPipe PoseLandmarker setup.
// The heavy WASM library is imported dynamically so it never runs during SSR.

import type { PoseLandmarker } from "@mediapipe/tasks-vision";

export interface PoseLandmarkerPaths {
  /** Directory serving the MediaPipe vision WASM assets. */
  wasmPath?: string;
  /** URL of the pose_landmarker .task model file. */
  modelPath?: string;
}

// Self-hosted defaults for the Next.js web app (see public/wasm and public/models).
// The extension passes chrome.runtime.getURL(...) paths instead.
const DEFAULT_WASM_PATH = "/wasm";
const DEFAULT_MODEL_PATH = "/models/pose_landmarker_lite.task";

/** Create and warm up a PoseLandmarker configured for live video. */
export async function createPoseLandmarker(
  paths: PoseLandmarkerPaths = {},
): Promise<PoseLandmarker> {
  const wasmPath = paths.wasmPath ?? DEFAULT_WASM_PATH;
  const modelPath = paths.modelPath ?? DEFAULT_MODEL_PATH;

  const { FilesetResolver, PoseLandmarker } = await import(
    "@mediapipe/tasks-vision"
  );

  const fileset = await FilesetResolver.forVisionTasks(wasmPath);

  return PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: modelPath,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}
