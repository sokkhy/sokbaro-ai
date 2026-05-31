// MediaPipe Pose landmark indices (33-point model).
// Reference: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
// Note: "LEFT"/"RIGHT" are from the subject's perspective.

export const POSE = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
} as const;

/** Connections used to draw the upper-body skeleton overlay. */
export const UPPER_BODY_CONNECTIONS: ReadonlyArray<[number, number]> = [
  [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER],
  [POSE.LEFT_EAR, POSE.LEFT_SHOULDER],
  [POSE.RIGHT_EAR, POSE.RIGHT_SHOULDER],
  [POSE.LEFT_EAR, POSE.NOSE],
  [POSE.RIGHT_EAR, POSE.NOSE],
];
