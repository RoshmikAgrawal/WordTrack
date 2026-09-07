import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Game, GameCategoryType, CATEGORY_DEFINITIONS } from "../types";
import { INITIAL_GAMES } from "../lib/seedGames";

function getDynamicCategoryLabel(catType: GameCategoryType, defaultLabel: string): string {
  try {
    const cached = localStorage.getItem("wordtrack_custom_categories_v2");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        const found = parsed.find(
          (c: any) =>
            c.id === catType ||
            c.id === catType.replace(/_/g, "-") ||
            c.id === catType.replace(/-/g, "_")
        );
        if (found && found.name) return found.name;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return defaultLabel;
}

/**
 * Normalizes game data to ensure isDaily, categoryType, and categoryConfig exist
 */
export function normalizeGame(raw: any): Game {
  const categoryType: GameCategoryType = raw.categoryType || (
    raw.category?.toLowerCase().includes("multi") ? "multi_board" :
    raw.category?.toLowerCase().includes("group") || raw.category?.toLowerCase().includes("connect") ? "grouping_deduction" :
    raw.category?.toLowerCase().includes("semantic") || raw.category?.toLowerCase().includes("ladder") ? "unlimited_steps" :
    raw.category?.toLowerCase().includes("speed") || raw.category?.toLowerCase().includes("match") ? "competitive_match" :
    raw.category?.toLowerCase().includes("trivia") || raw.category?.toLowerCase().includes("timed") ? "high_score_timed" :
    "classic_single"
  );

  const def = CATEGORY_DEFINITIONS[categoryType] || CATEGORY_DEFINITIONS.classic_single;
  const dynamicCategoryLabel = getDynamicCategoryLabel(categoryType, def.label);

  const isDaily = typeof raw.isDaily === "boolean" ? raw.isDaily : (
    categoryType === "competitive_match" ? false : true
  );

  const categoryConfig = raw.categoryConfig || {
    ...def.defaultConfig,
    ...(raw.maxAttempts ? { maxAttempts: Number(raw.maxAttempts) } : {}),
  };

  return {
    id: raw.id,
    title: raw.title || "Word Game",
    description: raw.description || "",
    gameUrl: raw.gameUrl || "https://google.com",
    iconUrl: raw.iconUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    isDaily,
    categoryType,
    categoryConfig,
    category: raw.category && raw.category !== def.label ? raw.category : dynamicCategoryLabel,
    maxAttempts: Number(raw.maxAttempts) || categoryConfig.maxAttempts || 6,
    isActive: raw.isActive !== false,
    colorTheme: raw.colorTheme || "from-emerald-500 to-teal-600",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Fetch all active games
 */
export async function getActiveGames(): Promise<Game[]> {
  try {
    const q = query(collection(db, "games"), where("isActive", "==", true));
    const snap = await getDocs(q);

    if (snap.empty) {
      return (INITIAL_GAMES as any[]).map(normalizeGame);
    }

    return snap.docs.map((docSnap) => normalizeGame({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("Could not fetch games from firestore, falling back to local list:", error);
    return (INITIAL_GAMES as any[]).map(normalizeGame);
  }
}

/**
 * Fetch all games including inactive (for admin view)
 */
export async function getAllGamesAdmin(): Promise<Game[]> {
  try {
    const snap = await getDocs(collection(db, "games"));
    if (snap.empty) {
      return (INITIAL_GAMES as any[]).map(normalizeGame);
    }
    return snap.docs.map((d) => normalizeGame({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "games");
  }
}

/**
 * Subscribe to all games for realtime catalog updates
 */
export function subscribeToGames(onGames: (games: Game[]) => void, onError?: (err: any) => void) {
  const gamesCol = collection(db, "games");
  return onSnapshot(
    gamesCol,
    (snap) => {
      if (snap.empty) {
        onGames((INITIAL_GAMES as any[]).map(normalizeGame));
      } else {
        const list = snap.docs.map((d) => normalizeGame({ id: d.id, ...d.data() }));
        onGames(list);
      }
    },
    (error) => {
      console.warn("Realtime games subscription error:", error);
      if (onError) onError(error);
      onGames((INITIAL_GAMES as any[]).map(normalizeGame));
    }
  );
}

/**
 * Add or update a game in the catalog (Admin)
 */
export async function saveGame(gameData: Partial<Game> & { id?: string; title: string; gameUrl: string }): Promise<string> {
  const gameId =
    gameData.id ||
    gameData.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const docRef = doc(db, "games", gameId);

  try {
    const categoryType: GameCategoryType = gameData.categoryType || "classic_single";
    const def = CATEGORY_DEFINITIONS[categoryType] || CATEGORY_DEFINITIONS.classic_single;

    const rawPayload: any = {
      id: gameId,
      title: gameData.title.trim(),
      description: gameData.description?.trim() || "",
      gameUrl: gameData.gameUrl.trim(),
      isDaily: gameData.isDaily !== undefined ? gameData.isDaily : def.defaultDaily,
      categoryType,
      categoryConfig: gameData.categoryConfig || def.defaultConfig,
      category: gameData.category || def.label,
      iconUrl:
        gameData.iconUrl?.trim() ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
      maxAttempts: Number(gameData.maxAttempts || gameData.categoryConfig?.maxAttempts) || 6,
      isActive: gameData.isActive !== false,
      colorTheme: gameData.colorTheme || "from-emerald-500 to-teal-600",
      updatedAt: serverTimestamp(),
    };

    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([_, v]) => v !== undefined)
    );

    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, payload);
    }

    return gameId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `games/${gameId}`);
  }
}

/**
 * Toggle game active status
 */
export async function toggleGameActive(gameId: string, currentActive: boolean): Promise<void> {
  const docRef = doc(db, "games", gameId);
  try {
    await updateDoc(docRef, {
      isActive: !currentActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
  }
}

/**
 * Delete game (Admin)
 */
export async function deleteGame(gameId: string): Promise<void> {
  const docRef = doc(db, "games", gameId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `games/${gameId}`);
  }
}

/**
 * Save and synchronize all staged admin catalog changes to Firestore
 */
export async function syncAdminGameCatalog(
  games: Game[],
  deletedGameIds: string[] = []
): Promise<{ savedCount: number; deletedCount: number }> {
  try {
    let savedCount = 0;
    let deletedCount = 0;

    // 1. Delete removed games from Firestore
    for (const id of deletedGameIds) {
      try {
        const docRef = doc(db, "games", id);
        await deleteDoc(docRef);
        deletedCount++;
      } catch (err) {
        console.warn(`Could not delete game doc ${id}:`, err);
      }
    }

    // 2. Persist/update all active and configured games
    for (const game of games) {
      const gameId =
        game.id ||
        game.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const docRef = doc(db, "games", gameId);

      const categoryType: GameCategoryType = game.categoryType || "classic_single";
      const def = CATEGORY_DEFINITIONS[categoryType] || CATEGORY_DEFINITIONS.classic_single;

      const payload = {
        id: gameId,
        title: game.title.trim(),
        description: game.description?.trim() || "",
        gameUrl: game.gameUrl.trim(),
        isDaily: game.isDaily !== undefined ? game.isDaily : def.defaultDaily,
        categoryType,
        categoryConfig: game.categoryConfig || def.defaultConfig,
        category: game.category || def.label,
        iconUrl:
          game.iconUrl?.trim() ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
        maxAttempts: Number(game.maxAttempts || game.categoryConfig?.maxAttempts) || 6,
        isActive: game.isActive !== false,
        colorTheme: game.colorTheme || "from-emerald-500 to-teal-600",
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });
      savedCount++;
    }

    return { savedCount, deletedCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "games");
  }
}
