import { Timestamp } from "firebase/firestore";

export type UserRole = "user" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  favoriteGameIds: string[];
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export type GameCategoryType =
  | "classic_single" // Wordle, Word500, Poople (1 board, limited tries)
  | "multi_board" // Dordle, Quordle, Octordle (Multiple boards, limited tries)
  | "unlimited_steps" // Contexto, Semantle, Weaver (Unlimited tries, step/guess count)
  | "grouping_deduction" // Connections, Swapple (4 groups, limited mistakes)
  | "competitive_match" // Victordle, Squabble (PvP / bot match)
  | "high_score_timed"; // SpellTower, Blossom (Points, word count, timer)

export interface CategoryConfig {
  maxAttempts?: number; // For classic_single, multi_board
  totalBoards?: number; // For multi_board (e.g., 2 for Dordle, 4 for Quordle, 8 for Octordle)
  maxMistakes?: number; // For grouping_deduction (e.g., 4)
  totalGroups?: number; // For grouping_deduction (default 4)
  stepMetricLabel?: string; // For unlimited_steps (e.g., "Guesses", "Steps")
  scoreType?: string; // For high_score_timed (e.g., "Score", "Points", "Words")
}

export interface Game {
  id: string;
  title: string;
  description: string;
  gameUrl: string;
  iconUrl?: string;
  isDaily: boolean; // TRUE: daily challenge; FALSE: casual/practice
  categoryType: GameCategoryType;
  categoryConfig: CategoryConfig;
  isActive: boolean;
  category?: string; // Display category name / backward compat
  maxAttempts?: number; // Backward compat alias
  colorTheme?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type GameLogStatus = "solved" | "failed";

export interface GameLog {
  id: string; // Format: ${userId}_${gameId}_${playedDate}
  userId: string;
  gameId: string;
  gameTitle: string;
  playedDate: string; // YYYY-MM-DD
  categoryType: GameCategoryType;
  status: GameLogStatus;

  // Category-specific metric payloads
  attemptsTaken?: number; // Used in classic_single, multi_board
  maxAttempts?: number; // Snapshot of allowed attempts
  boardsSolved?: number; // Used in multi_board
  totalBoards?: number; // Snapshot of total boards
  stepsCount?: number; // Used in unlimited_steps
  mistakesMade?: number; // Used in grouping_deduction
  groupsCleared?: number; // Used in grouping_deduction
  totalGroups?: number; // Snapshot of total groups in grouping_deduction
  scoreAchieved?: number; // Used in high_score_timed
  scoreType?: string; // Snapshot of score type
  attempts?: number | null; // Backward compatibility alias for classic attempts

  notes?: string; // Optional notes / clipboard share text
  loggedAt: any;
}

export interface DailyTrackerItem {
  game: Game;
  log?: GameLog;
  isCompleted: boolean;
}

export interface StatsSummary {
  totalPlayed: number;
  totalSolved: number;
  winRate: number; // percentage 0-100
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>; // attempt number -> count
  categoryStats: Record<string, { played: number; solved: number }>;
  favoriteGamePerformance: Array<{
    gameId: string;
    gameTitle: string;
    played: number;
    solved: number;
    winRate: number;
    averageAttempts: number;
  }>;
}

export interface DiaryDayRecap {
  date: string; // YYYY-MM-DD
  logs: GameLog[];
  solvedCount: number;
  failedCount: number;
  totalCount: number;
}

export type CategoryColorKey =
  | "emerald"
  | "indigo"
  | "amber"
  | "purple"
  | "rose"
  | "cyan"
  | "blue"
  | "fuchsia"
  | "teal"
  | "orange"
  | "lime"
  | "violet"
  | "pink"
  | "sky"
  | "slate"
  | "yellow";

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  colorKey: CategoryColorKey | string;
  defaultDaily?: boolean;
  loggable?: boolean;
  defaultConfig?: CategoryConfig;
  order?: number;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface CategoryMeta {
  type: GameCategoryType;
  label: string;
  description: string;
  defaultConfig: CategoryConfig;
  defaultDaily: boolean;
  loggable: boolean;
  colorKey: CategoryColorKey;
}

export const CATEGORY_DEFINITIONS: Record<GameCategoryType, CategoryMeta> = {
  classic_single: {
    type: "classic_single",
    label: "Classic Single-Board",
    description: "1 board with limited guesses (Wordle, Word500, Poople)",
    defaultConfig: { maxAttempts: 6 },
    defaultDaily: true,
    loggable: true,
    colorKey: "emerald",
  },
  multi_board: {
    type: "multi_board",
    label: "Multi-Board Grid",
    description: "Multiple simultaneous boards (Dordle, Quordle, Octordle)",
    defaultConfig: { totalBoards: 4, maxAttempts: 9 },
    defaultDaily: true,
    loggable: true,
    colorKey: "indigo",
  },
  unlimited_steps: {
    type: "unlimited_steps",
    label: "Unlimited Steps / Ladder",
    description: "Semantic proximity or step ladder counts (Contexto, Semantle, Weaver)",
    defaultConfig: { stepMetricLabel: "Guesses" },
    defaultDaily: true,
    loggable: true,
    colorKey: "amber",
  },
  grouping_deduction: {
    type: "grouping_deduction",
    label: "Grouping & Deduction",
    description: "Word grouping with limited allowed mistakes (Connections, Swapple)",
    defaultConfig: { totalGroups: 4, maxMistakes: 4 },
    defaultDaily: true,
    loggable: true,
    colorKey: "purple",
  },
  competitive_match: {
    type: "competitive_match",
    label: "Competitive / Match",
    description: "PvP battle, multiplayer rounds, or bot races (Victordle, Squabble)",
    defaultConfig: {},
    defaultDaily: false,
    loggable: false,
    colorKey: "rose",
  },
  high_score_timed: {
    type: "high_score_timed",
    label: "High Score / Timed",
    description: "Point accumulation, word counts, or timer (SpellTower, Blossom)",
    defaultConfig: { scoreType: "Points" },
    defaultDaily: true,
    loggable: true,
    colorKey: "cyan",
  },
};

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface GameSubmission {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  title: string;
  description: string;
  gameUrl: string;
  iconUrl?: string;
  isDaily: boolean;
  categoryType: GameCategoryType;
  categoryConfig: CategoryConfig;
  status: SubmissionStatus;
  adminFeedback?: string;
  submittedAt: string; // ISO string
  reviewedAt?: string; // ISO string
}
