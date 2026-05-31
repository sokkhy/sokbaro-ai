// Message contract shared across the extension's contexts
// (popup ↔ background ↔ offscreen ↔ content script).

import type { PostureStatus } from "@/lib/pose/types";

export type Phase = "idle" | "initializing" | "calibrating" | "monitoring" | "error";

export interface PostureState {
  monitoring: boolean;
  phase: Phase;
  score: number;
  status: PostureStatus;
  error?: string;
}

export type BannerVariant = "alert" | "info";

// popup → background
export interface StartMsg { type: "START" }
export interface StopMsg { type: "STOP" }
export interface GetStateMsg { type: "GET_STATE" }

// permission page → background
export interface CameraGrantedMsg { type: "CAMERA_GRANTED" }
export interface CameraDeniedMsg { type: "CAMERA_DENIED"; message: string }

// background → offscreen
export interface OffscreenStartMsg { type: "OFFSCREEN_START" }
export interface OffscreenStopMsg { type: "OFFSCREEN_STOP" }

// offscreen → background (sent once the offscreen script has loaded)
export interface OffscreenReadyMsg { type: "OFFSCREEN_READY" }

// offscreen → background
export interface StatusMsg {
  type: "STATUS";
  phase: Phase;
  score: number;
  status: PostureStatus;
}
export interface AlertMsg { type: "ALERT"; message: string; variant?: BannerVariant }
export interface ErrorMsg {
  type: "ERROR";
  message: string;
  /** Camera permission isn't actually granted — re-run the grant flow. */
  needsPermission?: boolean;
}

// background → content script
export interface ShowBannerMsg {
  type: "SHOW_BANNER";
  message: string;
  variant: BannerVariant;
}
export interface HideBannerMsg { type: "HIDE_BANNER" }

export type Message =
  | StartMsg
  | StopMsg
  | GetStateMsg
  | CameraGrantedMsg
  | CameraDeniedMsg
  | OffscreenStartMsg
  | OffscreenStopMsg
  | OffscreenReadyMsg
  | StatusMsg
  | AlertMsg
  | ErrorMsg
  | ShowBannerMsg
  | HideBannerMsg;

/** Path (relative to the extension root) of the invisible camera/detection page. */
export const OFFSCREEN_PATH = "src/offscreen.html";
/** Path of the one-time camera-permission grant page. */
export const PERMISSION_PATH = "src/permission.html";
