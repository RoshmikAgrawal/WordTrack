import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { GameSubmission, Game, GameCategoryType, CATEGORY_DEFINITIONS } from "../types";
import { saveGame } from "./games.service";

const SUBMISSIONS_COLLECTION = "game_submissions";

/**
 * Normalizes raw submission payload from Firestore or local cache
 */
export function normalizeSubmission(raw: any): GameSubmission {
  const categoryType: GameCategoryType = raw.categoryType || "classic_single";
  const def = CATEGORY_DEFINITIONS[categoryType] || CATEGORY_DEFINITIONS.classic_single;

  return {
    id: raw.id,
    userId: raw.userId || "",
    userDisplayName: raw.userDisplayName || "Anonymous Player",
    userEmail: raw.userEmail || "",
    title: raw.title || "Untitled Word Game",
    description: raw.description || "",
    gameUrl: raw.gameUrl || "",
    iconUrl: raw.iconUrl || "",
    isDaily: typeof raw.isDaily === "boolean" ? raw.isDaily : true,
    categoryType,
    categoryConfig: raw.categoryConfig || def.defaultConfig,
    status: raw.status || "pending",
    adminFeedback: raw.adminFeedback || "",
    submittedAt: raw.submittedAt || (raw.createdAt ? new Date(raw.createdAt?.toDate ? raw.createdAt.toDate() : raw.createdAt).toISOString() : new Date().toISOString()),
    reviewedAt: raw.reviewedAt || undefined,
  };
}

/**
 * Fetch all submissions submitted by a specific user
 */
export async function getUserSubmissions(userId: string): Promise<GameSubmission[]> {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const subs = snap.docs.map((d) => normalizeSubmission({ id: d.id, ...d.data() }));
    // Sort descending by submittedAt
    return subs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error: any) {
    if (error?.message && error.message.includes("requires an index")) {
      console.warn("[Firestore Index Required] User submissions query requires composite index:", error.message);
      return [];
    }
    handleFirestoreError(error, OperationType.GET, SUBMISSIONS_COLLECTION);
    return [];
  }
}

/**
 * Subscribe to user submissions in real-time
 */
export function subscribeToUserSubmissions(
  userId: string,
  callback: (subs: GameSubmission[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => normalizeSubmission({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      callback(list);
    },
    (error: any) => {
      if (error?.message && error.message.includes("requires an index")) {
        console.warn("[Firestore Index Required] Realtime user submissions subscription requires composite index:", error.message);
        callback([]);
      } else {
        console.warn("Realtime user submissions subscription error:", error);
      }
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, SUBMISSIONS_COLLECTION);
    }
  );
}

/**
 * Get count of active pending submissions for a user
 */
export async function getPendingSubmissionsCount(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("userId", "==", userId),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.warn("Could not query pending submissions count:", error);
    return 0;
  }
}

/**
 * Submit a new game for review (Enforces max 3 pending submissions quota)
 */
export async function createGameSubmission(
  data: Omit<GameSubmission, "id" | "status" | "submittedAt">
): Promise<string> {
  if (!data.userId) {
    throw new Error("You must be signed in to submit a game.");
  }

  // Validate pending quota
  const pendingCount = await getPendingSubmissionsCount(data.userId);
  if (pendingCount >= 3) {
    throw new Error("Submission quota reached. You can have at most 3 pending submissions at a time. Please wait for previous submissions to be reviewed.");
  }

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);

  const payload = {
    id: submissionId,
    userId: data.userId,
    userDisplayName: data.userDisplayName || "Anonymous Player",
    userEmail: data.userEmail || "",
    title: data.title.trim(),
    description: data.description?.trim() || "",
    gameUrl: data.gameUrl.trim(),
    iconUrl: data.iconUrl?.trim() || "",
    isDaily: data.isDaily !== false,
    categoryType: data.categoryType || "classic_single",
    categoryConfig: data.categoryConfig || {},
    status: "pending" as const,
    submittedAt: new Date().toISOString(),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
    return submissionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${SUBMISSIONS_COLLECTION}/${submissionId}`);
    throw error;
  }
}

/**
 * Fetch all submissions across users (Admin only)
 */
export async function getAllSubmissionsAdmin(): Promise<GameSubmission[]> {
  try {
    const snap = await getDocs(collection(db, SUBMISSIONS_COLLECTION));
    const list = snap.docs.map((d) => normalizeSubmission({ id: d.id, ...d.data() }));
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SUBMISSIONS_COLLECTION);
    return [];
  }
}

/**
 * Real-time listener for all submissions (Admin only)
 */
export function subscribeToAllSubmissionsAdmin(
  callback: (subs: GameSubmission[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, SUBMISSIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => normalizeSubmission({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      callback(list);
    },
    (error) => {
      console.warn("Realtime admin submissions subscription error:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, SUBMISSIONS_COLLECTION);
    }
  );
}

/**
 * Approve a user submission and make the game live in /games catalog
 */
export async function approveSubmission(
  submission: GameSubmission,
  editedGameData?: Partial<Game> & { adminFeedback?: string }
): Promise<void> {
  const gameToSave: Partial<Game> & { title: string; gameUrl: string } = {
    title: editedGameData?.title || submission.title,
    description: editedGameData?.description !== undefined ? editedGameData.description : submission.description,
    gameUrl: editedGameData?.gameUrl || submission.gameUrl,
    iconUrl: editedGameData?.iconUrl || submission.iconUrl,
    isDaily: editedGameData?.isDaily !== undefined ? editedGameData.isDaily : submission.isDaily,
    categoryType: editedGameData?.categoryType || submission.categoryType,
    categoryConfig: editedGameData?.categoryConfig || submission.categoryConfig,
    isActive: true,
  };

  try {
    // 1. Save and activate game in /games
    await saveGame(gameToSave);

    // 2. Mark submission as approved
    const subDocRef = doc(db, SUBMISSIONS_COLLECTION, submission.id);
    await updateDoc(subDocRef, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      ...(editedGameData?.adminFeedback ? { adminFeedback: editedGameData.adminFeedback } : {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SUBMISSIONS_COLLECTION}/${submission.id}`);
    throw error;
  }
}

/**
 * Reject a submission with optional feedback
 */
export async function rejectSubmission(
  submissionId: string,
  feedback?: string
): Promise<void> {
  const subDocRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
  try {
    await updateDoc(subDocRef, {
      status: "rejected",
      adminFeedback: feedback?.trim() || "Thank you for submitting! Unfortunately, this game does not meet our current catalog inclusion criteria.",
      reviewedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SUBMISSIONS_COLLECTION}/${submissionId}`);
    throw error;
  }
}
