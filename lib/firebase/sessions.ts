"use client";

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

import { getDb, getFirebaseAuth, isFirebaseConfigured } from "./client";
import type { SessionSummary } from "@/hooks/usePoseDetection";

const COLLECTION = "posture_sessions";

export interface StoredSession {
  id: string;
  startedAt: Date;
  endedAt: Date;
  avgScore: number;
  goodPct: number;
  alertsCount: number;
}

/** Ensure an anonymous user exists; returns the uid or null if unconfigured. */
async function ensureUid(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser?.uid ?? null;
}

/** Persist one finished session. Returns true if saved. */
export async function saveSession(summary: SessionSummary): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const db = getDb();
  const uid = await ensureUid();
  if (!db || !uid) return false;

  await addDoc(collection(db, COLLECTION), {
    userId: uid,
    startedAt: Timestamp.fromMillis(summary.startedAt),
    endedAt: Timestamp.fromMillis(summary.endedAt),
    avgScore: summary.avgScore,
    goodPct: summary.goodPct,
    alertsCount: summary.alertsCount,
    createdAt: Timestamp.now(),
  });
  return true;
}

/** Fetch the most recent sessions for the current user. */
export async function fetchRecentSessions(max = 30): Promise<StoredSession[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getDb();
  const uid = await ensureUid();
  if (!db || !uid) return [];

  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      startedAt: (data.startedAt as Timestamp).toDate(),
      endedAt: (data.endedAt as Timestamp).toDate(),
      avgScore: data.avgScore as number,
      goodPct: data.goodPct as number,
      alertsCount: data.alertsCount as number,
    };
  });
}
