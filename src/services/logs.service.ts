import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { GameLog, GameCategoryType, StatsSummary } from "../types";
import { calculateStreaks } from "../lib/utils";

/**
 * Generates deterministic log document ID: `${userId}_${gameId}_${playedDate}`
 */
export function getLogId(userId: string, gameId: string, playedDate: string): string {
  return `${userId}_${gameId}_${playedDate}`;
}

export interface SaveGameLogParams {
  userId: string;
  gameId: string;
  gameTitle: string;
  playedDate: string;
  categoryType: GameCategoryType;
  status: "solved" | "failed";

  // Category specific payloads
  attemptsTaken?: number | null;
  maxAttempts?: number;
  boardsSolved?: number | null;
  totalBoards?: number;
  stepsCount?: number | null;
  mistakesMade?: number | null;
  groupsCleared?: number | null;
  totalGroups?: number | null;
  scoreAchieved?: number | null;
  scoreType?: string;
  attempts?: number | null; // backward compatibility

  notes?: string;
}

/**
 * Helper to strip any undefined keys before sending to Firestore
 */
function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Upsert daily game score
 */
export async function saveGameLog(params: SaveGameLogParams): Promise<GameLog> {
  const logId = getLogId(params.userId, params.gameId, params.playedDate);
  const logRef = doc(db, "game_logs", logId);

  const payload: any = {
    id: logId,
    userId: params.userId,
    gameId: params.gameId,
    gameTitle: params.gameTitle,
    playedDate: params.playedDate,
    categoryType: params.categoryType || "classic_single",
    status: params.status,

    // Metrics
    attemptsTaken: params.attemptsTaken !== undefined ? params.attemptsTaken : (params.attempts ?? null),
    maxAttempts: params.maxAttempts ?? 6,
    boardsSolved: params.boardsSolved ?? null,
    totalBoards: params.totalBoards ?? (params.categoryType === "multi_board" ? 4 : null),
    stepsCount: params.stepsCount ?? null,
    mistakesMade: params.mistakesMade ?? null,
    groupsCleared: params.groupsCleared ?? null,
    totalGroups: params.totalGroups ?? (params.categoryType === "grouping_deduction" ? 4 : null),
    scoreAchieved: params.scoreAchieved ?? null,
    scoreType: params.scoreType ?? (params.categoryType === "high_score_timed" ? "pts" : null),
    attempts: params.attemptsTaken !== undefined ? params.attemptsTaken : (params.attempts ?? null),

    notes: params.notes ? params.notes.trim() : "",
    loggedAt: serverTimestamp(),
  };

  const cleanPayload = sanitizeFirestorePayload(payload);

  try {
    await setDoc(logRef, cleanPayload, { merge: true });
    return {
      ...cleanPayload,
      loggedAt: new Date().toISOString(),
    } as GameLog;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `game_logs/${logId}`);
  }
}

/**
 * Delete a game log
 */
export async function deleteGameLog(userId: string, gameId: string, playedDate: string): Promise<void> {
  const logId = getLogId(userId, gameId, playedDate);
  const logRef = doc(db, "game_logs", logId);
  try {
    await deleteDoc(logRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `game_logs/${logId}`);
  }
}

/**
 * Fetch logs for a specific user and specific date
 */
export async function getLogsForDate(userId: string, playedDate: string): Promise<GameLog[]> {
  try {
    const q = query(
      collection(db, "game_logs"),
      where("userId", "==", userId),
      where("playedDate", "==", playedDate)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as GameLog);
  } catch (error: any) {
    if (error?.message && error.message.includes("requires an index")) {
      console.warn("[Firestore Index Required] Game logs query requires composite index:", error.message);
      return [];
    }
    handleFirestoreError(error, OperationType.GET, "game_logs");
  }
}

/**
 * Real-time subscription to logs for a specific user on a specific date (e.g. today)
 */
export function subscribeToDailyLogs(
  userId: string,
  playedDate: string,
  onLogs: (logs: GameLog[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, "game_logs"),
    where("userId", "==", userId),
    where("playedDate", "==", playedDate)
  );

  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map((d) => d.data() as GameLog);
      onLogs(logs);
    },
    (error: any) => {
      if (error?.message && error.message.includes("requires an index")) {
        console.warn("[Firestore Index Required] Daily game logs subscription requires composite index:", error.message);
        onLogs([]);
      } else {
        console.error("Daily logs subscription error:", error);
      }
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time subscription to ALL logs for a user (for Diary & Lifetime Analytics)
 */
export function subscribeToUserLifetimeLogs(
  userId: string,
  onLogs: (logs: GameLog[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, "game_logs"), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map((d) => d.data() as GameLog);
      // Sort in memory by playedDate descending
      logs.sort((a, b) => (b.playedDate || "").localeCompare(a.playedDate || ""));
      onLogs(logs);
    },
    (error: any) => {
      if (error?.message && error.message.includes("requires an index")) {
        console.warn("[Firestore Index Required] Lifetime logs subscription requires composite index:", error.message);
        onLogs([]);
      } else {
        console.error("Lifetime logs subscription error:", error);
      }
      if (onError) onError(error);
    }
  );
}

/**
 * Aggregates lifetime stats from an array of GameLogs
 */
export function computeLifetimeStats(logs: GameLog[]): StatsSummary {
  const totalPlayed = logs.length;
  if (totalPlayed === 0) {
    return {
      totalPlayed: 0,
      totalSolved: 0,
      winRate: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      categoryStats: {},
      favoriteGamePerformance: [],
    };
  }

  let totalSolved = 0;
  const guessDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };
  const uniqueDates = new Set<string>();
  const categoryStats: Record<string, { played: number; solved: number }> = {};
  const gameStatsMap: Record<
    string,
    { title: string; played: number; solved: number; totalAttempts: number }
  > = {};

  for (const log of logs) {
    uniqueDates.add(log.playedDate);

    // Track category counts
    const cat = log.categoryType || "classic_single";
    if (!categoryStats[cat]) {
      categoryStats[cat] = { played: 0, solved: 0 };
    }
    categoryStats[cat].played += 1;

    // Track per-game stats
    if (!gameStatsMap[log.gameId]) {
      gameStatsMap[log.gameId] = {
        title: log.gameTitle,
        played: 0,
        solved: 0,
        totalAttempts: 0,
      };
    }
    gameStatsMap[log.gameId].played += 1;

    if (log.status === "solved") {
      totalSolved += 1;
      categoryStats[cat].solved += 1;
      gameStatsMap[log.gameId].solved += 1;

      const att = log.attemptsTaken || log.attempts;
      if (att) {
        gameStatsMap[log.gameId].totalAttempts += att;
        const bucket = att > 6 ? 6 : att;
        guessDistribution[bucket] = (guessDistribution[bucket] || 0) + 1;
      }
    }
  }

  const winRate = Math.round((totalSolved / totalPlayed) * 100);
  const { currentStreak, maxStreak } = calculateStreaks(Array.from(uniqueDates));

  const favoriteGamePerformance = Object.entries(gameStatsMap).map(([gameId, val]) => ({
    gameId,
    gameTitle: val.title,
    played: val.played,
    solved: val.solved,
    winRate: Math.round((val.solved / val.played) * 100),
    averageAttempts: val.solved > 0 ? +(val.totalAttempts / val.solved).toFixed(1) : 0,
  }));

  return {
    totalPlayed,
    totalSolved,
    winRate,
    currentStreak,
    maxStreak,
    guessDistribution,
    categoryStats,
    favoriteGamePerformance,
  };
}
