import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  onSnapshot,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { CategoryItem, Game, GameCategoryType } from "../types";

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: "classic_single",
    name: "Classic Single-Board",
    description: "1 board with limited guesses (Wordle, Word500, Poople)",
    colorKey: "emerald",
    defaultDaily: true,
    loggable: true,
    defaultConfig: { maxAttempts: 6 },
    order: 1,
  },
  {
    id: "multi_board",
    name: "Multi-Board Grid",
    description: "Multiple simultaneous boards (Dordle, Quordle, Octordle)",
    colorKey: "indigo",
    defaultDaily: true,
    loggable: true,
    defaultConfig: { totalBoards: 4, maxAttempts: 9 },
    order: 2,
  },
  {
    id: "unlimited_steps",
    name: "Unlimited Steps / Ladder",
    description: "Semantic proximity or step ladder counts (Contexto, Semantle, Weaver)",
    colorKey: "amber",
    defaultDaily: true,
    loggable: true,
    defaultConfig: { stepMetricLabel: "Guesses" },
    order: 3,
  },
  {
    id: "grouping_deduction",
    name: "Grouping & Deduction",
    description: "Word grouping with limited allowed mistakes (Connections, Swapple)",
    colorKey: "purple",
    defaultDaily: true,
    loggable: true,
    defaultConfig: { totalGroups: 4, maxMistakes: 4 },
    order: 4,
  },
  {
    id: "competitive_match",
    name: "Competitive / Match",
    description: "PvP battle, multiplayer rounds, or bot races (Victordle, Squabble)",
    colorKey: "rose",
    defaultDaily: false,
    loggable: false,
    defaultConfig: {},
    order: 5,
  },
  {
    id: "high_score_timed",
    name: "High Score / Timed",
    description: "Point accumulation, word counts, or timer (SpellTower, Blossom)",
    colorKey: "cyan",
    defaultDaily: true,
    loggable: true,
    defaultConfig: { scoreType: "Points" },
    order: 6,
  },
];

const LOCAL_STORAGE_KEY = "wordtrack_custom_categories_v2";

/**
 * Get cached categories from localStorage
 */
function getCachedCategories(): CategoryItem[] | null {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate if it matches the new category system (has classic_single, etc.)
        const hasNewSystemFormat = parsed.some((c) =>
          ["classic_single", "multi_board", "unlimited_steps", "grouping_deduction", "competitive_match", "high_score_timed"].includes(c.id)
        );
        if (hasNewSystemFormat) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Could not read categories from localStorage:", err);
  }
  return null;
}

/**
 * Cache categories to localStorage
 */
function setCachedCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.warn("Could not write categories to localStorage:", err);
  }
}

/**
 * Fetch all categories from Firestore, bootstrap defaults if collection is empty or legacy, or fallback to cache
 */
export async function getAllCategories(): Promise<CategoryItem[]> {
  const cached = getCachedCategories();
  try {
    const colRef = collection(db, "categories");
    const snap = await getDocs(colRef);

    // If Firestore categories collection is empty or contains old system data, bootstrap with new system defaults
    const isLegacy =
      !snap.empty &&
      snap.docs.some((d) => ["classic-5-letter", "multi-grid", "semantic-association"].includes(d.id));

    if (snap.empty || isLegacy) {
      const initialList = cached && cached.length > 0 ? cached : DEFAULT_CATEGORIES;
      try {
        await Promise.all(
          initialList.map((cat, idx) => {
            const catId = cat.id;
            const docRef = doc(db, "categories", catId);
            return setDoc(
              docRef,
              {
                id: catId,
                name: cat.name.trim(),
                description: cat.description?.trim() || "",
                colorKey: cat.colorKey || "emerald",
                defaultDaily: cat.defaultDaily ?? true,
                loggable: cat.loggable ?? true,
                defaultConfig: cat.defaultConfig || {},
                order: cat.order ?? idx + 1,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          })
        );
      } catch (seedErr) {
        console.warn("Could not bootstrap initial categories in Firestore:", seedErr);
      }
      setCachedCategories(initialList);
      return initialList;
    }

    const categories: CategoryItem[] = [];
    snap.forEach((d) => {
      const data = d.data();
      categories.push({
        id: d.id,
        name: data.name || d.id,
        description: data.description || "",
        colorKey: data.colorKey || "emerald",
        defaultDaily: data.defaultDaily !== undefined ? data.defaultDaily : true,
        loggable: data.loggable !== undefined ? data.loggable : true,
        defaultConfig: data.defaultConfig || {},
        order: typeof data.order === "number" ? data.order : 99,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    categories.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setCachedCategories(categories);
    return categories;
  } catch (error) {
    console.warn("Could not fetch categories from Firestore, using local defaults/cache:", error);
    return cached && cached.length > 0 ? cached : [...DEFAULT_CATEGORIES];
  }
}

/**
 * Save / update a single category
 */
export async function saveCategory(category: CategoryItem): Promise<CategoryItem> {
  const catId =
    category.id ||
    category.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

  const staged: CategoryItem = {
    ...category,
    id: catId,
    name: category.name.trim(),
    description: category.description?.trim() || "",
    colorKey: category.colorKey || "emerald",
    defaultDaily: category.defaultDaily ?? true,
    loggable: category.loggable ?? true,
    defaultConfig: category.defaultConfig || {},
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, "categories", catId);
    const payload = {
      id: catId,
      name: staged.name,
      description: staged.description,
      colorKey: staged.colorKey,
      defaultDaily: staged.defaultDaily,
      loggable: staged.loggable,
      defaultConfig: staged.defaultConfig,
      order: typeof staged.order === "number" ? staged.order : 99,
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.warn("Falling back to local cache for category update:", error);
  }

  // Update local cache
  const cached = getCachedCategories() || [...DEFAULT_CATEGORIES];
  const existingIdx = cached.findIndex((c) => c.id === catId || c.name.toLowerCase() === staged.name.toLowerCase());
  if (existingIdx >= 0) {
    cached[existingIdx] = staged;
  } else {
    cached.push(staged);
  }
  setCachedCategories(cached);

  return staged;
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, "categories", categoryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("Error deleting category from Firestore, removing from cache:", error);
  }

  const cached = getCachedCategories() || [...DEFAULT_CATEGORIES];
  const filtered = cached.filter((c) => c.id !== categoryId);
  setCachedCategories(filtered);
}

/**
 * Save and sync all categories (including deletes) and cascade category changes to all matching games
 */
export async function syncAdminCategories(
  categories: CategoryItem[],
  deletedIds: string[] = [],
  allGames: Game[] = [],
  originalCategories: CategoryItem[] = []
): Promise<{ updatedGames: Game[]; affectedGamesCount: number; renameMap: Record<string, string> }> {
  // Always update local storage cache immediately so UI is responsive
  setCachedCategories(categories);

  const renameMap: Record<string, string> = {};

  // 1. Detect renamed categories by comparing original categories against new categories by ID
  for (const orig of originalCategories) {
    const matched = categories.find((c) => c.id === orig.id);
    if (matched && matched.name.trim() !== orig.name.trim()) {
      renameMap[orig.name.trim()] = matched.name.trim();
      renameMap[orig.name.trim().toLowerCase()] = matched.name.trim();
    }
  }

  // 2. Map deleted category names to the first available category if needed
  const fallbackCategory = categories[0] || DEFAULT_CATEGORIES[0];
  for (const delId of deletedIds) {
    const deletedCat = originalCategories.find((c) => c.id === delId);
    if (deletedCat) {
      renameMap[deletedCat.name.trim()] = fallbackCategory.name;
      renameMap[deletedCat.name.trim().toLowerCase()] = fallbackCategory.name;
    }
  }

  // 3. Process deletes in Firestore
  try {
    const deletePromises = deletedIds.map(async (id) => {
      try {
        const docRef = doc(db, "categories", id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn(`Could not delete category doc ${id}:`, err);
      }
    });
    await Promise.all(deletePromises);

    // 4. Persist categories to Firestore
    const writePromises = categories.map((cat, i) => {
      const catId = cat.id;

      const docRef = doc(db, "categories", catId);
      const payload = {
        id: catId,
        name: cat.name.trim(),
        description: cat.description?.trim() || "",
        colorKey: cat.colorKey || "emerald",
        defaultDaily: cat.defaultDaily ?? true,
        loggable: cat.loggable ?? true,
        defaultConfig: cat.defaultConfig || {},
        order: i + 1,
        updatedAt: serverTimestamp(),
      };

      return setDoc(docRef, payload, { merge: true });
    });
    await Promise.all(writePromises);
  } catch (error) {
    console.warn("Firestore categories sync issue (changes preserved locally):", error);
  }

  // 5. Cascade rename changes to all affected games in Firestore and state
  let affectedGamesCount = 0;
  const gameUpdatePromises: Promise<any>[] = [];

  const updatedGames: Game[] = allGames.map((game) => {
    // Check if category name or categoryType needs updating
    let needsUpdate = false;
    let newCatName = game.category;
    let newCatType = game.categoryType;

    // A. Check if the game belongs to a deleted category
    if (deletedIds.includes(game.categoryType)) {
      needsUpdate = true;
      newCatType = (fallbackCategory.id as GameCategoryType) || "classic_single";
      newCatName = fallbackCategory.name;
    } else {
      // B. Check if matching category by ID has a new name
      const matchingCat = categories.find(
        (c) =>
          c.id === game.categoryType ||
          c.id === game.categoryType?.replace(/_/g, "-") ||
          c.id === game.categoryType?.replace(/-/g, "_")
      );
      if (matchingCat && matchingCat.name.trim() && game.category !== matchingCat.name.trim()) {
        needsUpdate = true;
        newCatName = matchingCat.name.trim();
      } else if (renameMap[game.category] && renameMap[game.category] !== game.category) {
        needsUpdate = true;
        newCatName = renameMap[game.category];
      }
    }

    if (needsUpdate) {
      affectedGamesCount++;
      const updatedGame: Game = {
        ...game,
        category: newCatName,
        categoryType: newCatType,
        updatedAt: new Date().toISOString(),
      };

      // Persist to Firestore
      try {
        const gameDocRef = doc(db, "games", game.id);
        const updatePromise = setDoc(
          gameDocRef,
          {
            category: newCatName,
            categoryType: newCatType,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((err) => console.warn(`Error updating game ${game.id} category:`, err));
        gameUpdatePromises.push(updatePromise);
      } catch (err) {
        console.warn(`Could not prepare update for game ${game.id}:`, err);
      }

      return updatedGame;
    }
    return game;
  });

  if (gameUpdatePromises.length > 0) {
    try {
      await Promise.all(gameUpdatePromises);
    } catch (err) {
      console.warn("Some game category updates in Firestore encountered an issue:", err);
    }
  }

  // Update local storage backup for active games
  try {
    localStorage.setItem("wordtrack_active_games_v2", JSON.stringify(updatedGames));
  } catch (e) {
    // Ignore storage quota
  }

  return { updatedGames, affectedGamesCount, renameMap };
}

/**
 * Real-time subscription to category collection
 */
export function subscribeToCategories(
  onSuccess: (categories: CategoryItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, "categories");
    return onSnapshot(
      colRef,
      (snap) => {
        if (snap.empty) {
          const cached = getCachedCategories();
          onSuccess(cached && cached.length > 0 ? cached : DEFAULT_CATEGORIES);
          return;
        }

        const categories: CategoryItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          categories.push({
            id: d.id,
            name: data.name || d.id,
            description: data.description || "",
            colorKey: data.colorKey || "emerald",
            defaultDaily: data.defaultDaily !== undefined ? data.defaultDaily : true,
            loggable: data.loggable !== undefined ? data.loggable : true,
            defaultConfig: data.defaultConfig || {},
            order: typeof data.order === "number" ? data.order : 99,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });

        categories.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
        setCachedCategories(categories);
        onSuccess(categories);
      },
      (err) => {
        console.warn("Categories snapshot subscription error, falling back to cache:", err);
        const cached = getCachedCategories();
        onSuccess(cached && cached.length > 0 ? cached : DEFAULT_CATEGORIES);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn("Failed to attach categories listener:", err);
    const cached = getCachedCategories();
    onSuccess(cached && cached.length > 0 ? cached : DEFAULT_CATEGORIES);
    return () => {};
  }
}
