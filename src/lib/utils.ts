import { Game, GameLog, GameCategoryType, CategoryItem, CATEGORY_DEFINITIONS } from "../types";

/**
 * Basic classname merger
 */
export function cn(...inputs: (string | boolean | null | undefined | number)[]): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Returns YYYY-MM-DD for local date
 */
export function getLocalDateISO(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD into human friendly string
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates current streak and max streak based on unique daily played dates (sorted or unsorted)
 */
export function calculateStreaks(uniqueDates: string[]): { currentStreak: number; maxStreak: number } {
  if (!uniqueDates || uniqueDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const sorted = Array.from(new Set(uniqueDates)).sort();
  if (sorted.length === 0) return { currentStreak: 0, maxStreak: 0 };

  const today = getLocalDateISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateISO(yesterdayDate);

  let currentStreak = 0;
  let maxStreak = 0;
  let running = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prevDate = new Date(sorted[i - 1]);
      const currDate = new Date(sorted[i]);
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        running += 1;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    if (running > maxStreak) {
      maxStreak = running;
    }
  }

  // Check if current streak extends to today or yesterday
  const lastPlayed = sorted[sorted.length - 1];
  if (lastPlayed === today || lastPlayed === yesterday) {
    // Walk backwards from last played
    currentStreak = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      const curr = new Date(sorted[i]);
      const prev = new Date(sorted[i - 1]);
      const diffDays = Math.round(Math.abs(curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  return { currentStreak, maxStreak };
}

/**
 * Intelligent score / emoji share text parser
 * Detects strings like "Wordle 1,123 4/6", "Connections Puzzle #450", etc.
 */
export function parseWordGameShareText(text: string): {
  detectedAttempts?: number;
  detectedStatus?: "solved" | "failed";
  detectedSteps?: number;
  cleanedNotes: string;
} {
  const trimmed = text.trim();
  let detectedAttempts: number | undefined;
  let detectedStatus: "solved" | "failed" | undefined;
  let detectedSteps: number | undefined;

  // Check for X/6 or 4/6 or 3/6
  const matchFraction = trimmed.match(/([0-9X])\/([0-9]+)/i);
  if (matchFraction) {
    const numerator = matchFraction[1].toUpperCase();
    if (numerator === "X") {
      detectedStatus = "failed";
      detectedAttempts = undefined;
    } else {
      const num = parseInt(numerator, 10);
      if (!isNaN(num)) {
        detectedAttempts = num;
        detectedStatus = "solved";
      }
    }
  }

  // Check for steps or guesses pattern e.g. "solved in 34 guesses", "34 guesses", "Weaver 6 steps"
  const matchSteps = trimmed.match(/(?:in\s+)?(\d+)\s+(?:guesses|steps|tries|turns)/i) ||
                     trimmed.match(/(?:guesses|steps|tries|turns):\s*(\d+)/i);
  if (matchSteps) {
    const num = parseInt(matchSteps[1], 10);
    if (!isNaN(num)) {
      detectedSteps = num;
      detectedStatus = "solved";
    }
  }

  return {
    detectedAttempts,
    detectedStatus,
    detectedSteps,
    cleanedNotes: trimmed,
  };
}

export interface CategoryColorPalette {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  ring: string;
}

export const CATEGORY_COLOR_PALETTES: Record<string, CategoryColorPalette> = {
  emerald: {
    label: "Emerald Green",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    ring: "ring-emerald-500/40",
  },
  indigo: {
    label: "Electric Indigo",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    dot: "bg-indigo-400",
    ring: "ring-indigo-500/40",
  },
  amber: {
    label: "Warm Amber",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    ring: "ring-amber-500/40",
  },
  purple: {
    label: "Vivid Purple",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
    ring: "ring-purple-500/40",
  },
  rose: {
    label: "Crimson Rose",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
    ring: "ring-rose-500/40",
  },
  cyan: {
    label: "Aqua Cyan",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    dot: "bg-cyan-400",
    ring: "ring-cyan-500/40",
  },
  blue: {
    label: "Ocean Blue",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
    ring: "ring-blue-500/40",
  },
  fuchsia: {
    label: "Fuchsia Pink",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-400",
    border: "border-fuchsia-500/30",
    dot: "bg-fuchsia-400",
    ring: "ring-fuchsia-500/40",
  },
  teal: {
    label: "Deep Teal",
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/30",
    dot: "bg-teal-400",
    ring: "ring-teal-500/40",
  },
  orange: {
    label: "Sunset Orange",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
    ring: "ring-orange-500/40",
  },
  lime: {
    label: "Neon Lime",
    bg: "bg-lime-500/10",
    text: "text-lime-400",
    border: "border-lime-500/30",
    dot: "bg-lime-400",
    ring: "ring-lime-500/40",
  },
  violet: {
    label: "Cosmic Violet",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/30",
    dot: "bg-violet-400",
    ring: "ring-violet-500/40",
  },
  pink: {
    label: "Blush Pink",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/30",
    dot: "bg-pink-400",
    ring: "ring-pink-500/40",
  },
  sky: {
    label: "Sky Blue",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
    ring: "ring-sky-500/40",
  },
  slate: {
    label: "Neutral Slate",
    bg: "bg-slate-500/10",
    text: "text-slate-300",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
    ring: "ring-slate-500/40",
  },
  yellow: {
    label: "Golden Yellow",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    dot: "bg-yellow-400",
    ring: "ring-yellow-500/40",
  },
};

/**
 * Returns human-readable label for a GameCategoryType or custom category name.
 * Checks custom dynamic categories first, then CATEGORY_DEFINITIONS, then game.category or raw key.
 */
export function getCategoryTypeLabel(
  catType?: GameCategoryType | string,
  categories?: CategoryItem[] | { id?: string; name: string; colorKey?: string }[],
  gameCategoryName?: string
): string {
  if (!catType && !gameCategoryName) return "Classic Single-Board";

  // 1. Check if matching category exists in dynamic categories list
  if (Array.isArray(categories) && categories.length > 0) {
    // Match by ID (e.g. "multi_board" or "multi-board")
    const matchedById = categories.find((c) => c.id === catType || c.id === catType?.replace(/_/g, "-") || c.id === catType?.replace(/-/g, "_"));
    if (matchedById && matchedById.name) {
      return matchedById.name;
    }

    // Match by category name
    if (gameCategoryName) {
      const matchedByName = categories.find((c) => c.name.toLowerCase() === gameCategoryName.toLowerCase());
      if (matchedByName && matchedByName.name) {
        return matchedByName.name;
      }
    }
  }

  // 2. If the game has a custom category string name stored, check if it's already a custom renamed string
  if (gameCategoryName && gameCategoryName.trim()) {
    return gameCategoryName.trim();
  }

  // 3. Fallback to default definition metadata
  if (catType && CATEGORY_DEFINITIONS[catType as GameCategoryType]) {
    return CATEGORY_DEFINITIONS[catType as GameCategoryType].label;
  }

  return catType || "Classic";
}

/**
 * Returns the description for a GameCategoryType or CategoryItem from custom dynamic categories.
 */
export function getCategoryDescription(
  catType?: GameCategoryType | string,
  categories?: CategoryItem[]
): string {
  if (!catType) return "";

  // 1. Check custom dynamic categories list
  if (Array.isArray(categories) && categories.length > 0) {
    const matched = categories.find(
      (c) =>
        c.id === catType ||
        c.id === catType.replace(/_/g, "-") ||
        c.id === catType.replace(/-/g, "_") ||
        c.name.toLowerCase() === catType.toLowerCase()
    );
    if (matched && matched.description) {
      return matched.description;
    }
  }

  // 2. Fallback to default definition
  if (CATEGORY_DEFINITIONS[catType as GameCategoryType]) {
    return CATEGORY_DEFINITIONS[catType as GameCategoryType].description;
  }

  return "";
}

/**
 * Get category badge color styling. Looks up colorKey or matches standard palette.
 */
export function getCategoryBadgeStyle(
  categoryOrType: string,
  categories?: CategoryItem[] | { id?: string; name: string; colorKey: string }[]
): CategoryColorPalette {
  const fallback = CATEGORY_COLOR_PALETTES.cyan;

  // 1. Check custom dynamic categories list first (by id or name)
  if (Array.isArray(categories) && categories.length > 0) {
    const matched = categories.find(
      (c) =>
        c.id === categoryOrType ||
        c.id === categoryOrType.replace(/_/g, "-") ||
        c.id === categoryOrType.replace(/-/g, "_") ||
        c.name.toLowerCase() === categoryOrType.toLowerCase()
    );
    if (matched && matched.colorKey && CATEGORY_COLOR_PALETTES[matched.colorKey]) {
      return CATEGORY_COLOR_PALETTES[matched.colorKey];
    }
  }

  // 2. Check if it's a known categoryType enum
  if (CATEGORY_DEFINITIONS[categoryOrType as GameCategoryType]) {
    const key = CATEGORY_DEFINITIONS[categoryOrType as GameCategoryType].colorKey;
    return CATEGORY_COLOR_PALETTES[key] || fallback;
  }

  switch (categoryOrType) {
    case "Classic Single-Board":
    case "Classic 5-Letter":
      return CATEGORY_COLOR_PALETTES.emerald;
    case "Multi-Board Grid":
    case "Multi-Grid":
    case "Multi Board":
    case "Multi-Board":
      return CATEGORY_COLOR_PALETTES.indigo;
    case "Unlimited Steps / Ladder":
    case "Semantic / Association":
    case "Unlimited Steps":
      return CATEGORY_COLOR_PALETTES.amber;
    case "Grouping & Deduction":
    case "Connections & Grouping":
      return CATEGORY_COLOR_PALETTES.purple;
    case "Competitive / Match":
    case "Anagram & Speed":
      return CATEGORY_COLOR_PALETTES.rose;
    case "High Score / Timed":
    case "Daily Puzzle & Trivia":
      return CATEGORY_COLOR_PALETTES.cyan;
    default: {
      const keys = Object.keys(CATEGORY_COLOR_PALETTES);
      let hash = 0;
      for (let i = 0; i < categoryOrType.length; i++) {
        hash = categoryOrType.charCodeAt(i) + ((hash << 5) - hash);
      }
      const key = keys[Math.abs(hash) % keys.length];
      return CATEGORY_COLOR_PALETTES[key] || fallback;
    }
  }
}

/**
 * Formats a score log into a concise badge string matching the category specifications:
 * - classic_single: "Solved 4/6" | "Failed (X/6)"
 * - multi_board: "Solved 8/8 in 11/13 tries" | "Failed (6/8 boards)"
 * - unlimited_steps: "Solved in 34 guesses" | "Gave Up (42 guesses)"
 * - grouping_deduction: "Perfect (0 mistakes)" | "Solved (2 mistakes)" | "Failed (2/4 groups)"
 * - high_score_timed: "1,420 pts" | "Score: 840"
 */
export function formatGameLogBadge(log: GameLog): string {
  const isSolved = log.status === "solved";
  const catType = log.categoryType || "classic_single";

  switch (catType) {
    case "classic_single": {
      const att = log.attemptsTaken || log.attempts || "?";
      const max = log.maxAttempts || 6;
      return isSolved ? `Solved ${att}/${max}` : `Failed (X/${max})`;
    }

    case "multi_board": {
      const totalBoards = log.totalBoards || 4;
      const boards = log.boardsSolved ?? totalBoards;
      const att = log.attemptsTaken || log.attempts || "?";
      const max = log.maxAttempts || 9;
      if (isSolved) {
        return `Solved ${totalBoards}/${totalBoards} in ${att}/${max} tries`;
      }
      return `Failed (${boards}/${totalBoards} boards)`;
    }

    case "unlimited_steps": {
      const steps = log.stepsCount || log.attemptsTaken || log.attempts || "?";
      return `${steps} steps`;
    }

    case "grouping_deduction": {
      const mistakes = log.mistakesMade ?? 0;
      const totalGroups = log.totalGroups || 4;
      const cleared = log.groupsCleared ?? (isSolved ? totalGroups : 0);

      if (isSolved) {
        return mistakes === 0 ? "Perfect (0 mistakes)" : `Solved (${mistakes} mistake${mistakes === 1 ? "" : "s"})`;
      }
      return `Failed (${cleared}/${totalGroups} groups)`;
    }

    case "high_score_timed": {
      const score = log.scoreAchieved ?? log.attemptsTaken ?? 0;
      const scoreType = log.scoreType || "pts";
      return `${score.toLocaleString()} ${scoreType}`;
    }

    case "competitive_match": {
      return isSolved ? "Match Won" : "Match Defeat";
    }

    default: {
      const att = log.attemptsTaken || log.attempts;
      return isSolved ? (att ? `Solved in ${att}` : "Solved") : "Failed";
    }
  }
}

/**
 * Returns a detailed human sentence for a game log
 */
export function formatGameLogDetails(log: GameLog): string {
  const isSolved = log.status === "solved";
  const catType = log.categoryType || "classic_single";

  switch (catType) {
    case "classic_single":
      return isSolved
        ? `Solved in ${log.attemptsTaken || log.attempts || "?"} of ${log.maxAttempts || 6} attempts`
        : `Unsolved after ${log.maxAttempts || 6} attempts`;

    case "multi_board":
      return isSolved
        ? `Cleared all ${log.totalBoards || 4} boards in ${log.attemptsTaken || log.attempts || "?"} attempts (max ${log.maxAttempts || 9})`
        : `Cleared ${log.boardsSolved || 0} of ${log.totalBoards || 4} boards`;

    case "unlimited_steps":
      return `Reached solution in ${log.stepsCount || log.attemptsTaken || log.attempts || "?"} steps / guesses`;

    case "grouping_deduction": {
      const totalGroups = log.totalGroups || 4;
      return isSolved
        ? `All ${totalGroups} categories solved with ${log.mistakesMade || 0} mistakes`
        : `Solved ${log.groupsCleared ?? 0} of ${totalGroups} categories (${log.mistakesMade ?? 4} mistakes)`;
    }

    case "high_score_timed":
      return `Achieved high score of ${log.scoreAchieved?.toLocaleString() || 0} ${log.scoreType || "points"}`;

    default:
      return isSolved ? "Completed successfully" : "Unsuccessful attempt";
  }
}
