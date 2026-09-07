import { doc, setDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Game } from "../types";

export const INITIAL_GAMES: Omit<Game, "createdAt" | "updatedAt">[] = [
  {
    id: "wordle",
    title: "Wordle",
    description: "The iconic daily 5-letter word puzzle by The New York Times. Guess the word in 6 tries with color feedback.",
    gameUrl: "https://www.nytimes.com/games/wordle/index.html",
    isDaily: true,
    categoryType: "classic_single",
    categoryConfig: { maxAttempts: 6 },
    category: "Classic Single-Board",
    iconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 6,
    isActive: true,
    colorTheme: "from-emerald-500 to-green-600",
  },
  {
    id: "word500",
    title: "Word500",
    description: "A logic-heavy deduction word game. Guess 5-letter words with green, yellow, and red indicator counts.",
    gameUrl: "https://www.word500.com/",
    isDaily: true,
    categoryType: "classic_single",
    categoryConfig: { maxAttempts: 8 },
    category: "Classic Single-Board",
    iconUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 8,
    isActive: true,
    colorTheme: "from-teal-500 to-emerald-700",
  },
  {
    id: "octordle",
    title: "Octordle",
    description: "Solve 8 distinct Wordle boards at the exact same time in 13 guesses. The ultimate multi-grid test.",
    gameUrl: "https://octordle.com/",
    isDaily: true,
    categoryType: "multi_board",
    categoryConfig: { totalBoards: 8, maxAttempts: 13 },
    category: "Multi-Board Grid",
    iconUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 13,
    isActive: true,
    colorTheme: "from-indigo-500 to-purple-700",
  },
  {
    id: "quordle",
    title: "Quordle",
    description: "4 simultaneous Wordle grids with 9 total guesses. Powered by Merriam-Webster dictionary.",
    gameUrl: "https://www.merriam-webster.com/games/quordle/",
    isDaily: true,
    categoryType: "multi_board",
    categoryConfig: { totalBoards: 4, maxAttempts: 9 },
    category: "Multi-Board Grid",
    iconUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 9,
    isActive: true,
    colorTheme: "from-blue-500 to-indigo-600",
  },
  {
    id: "poople",
    title: "Poople",
    description: "A humorous and delightfully challenging word deduction puzzle game played daily worldwide.",
    gameUrl: "https://poople.net/",
    isDaily: true,
    categoryType: "classic_single",
    categoryConfig: { maxAttempts: 6 },
    category: "Classic Single-Board",
    iconUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 6,
    isActive: true,
    colorTheme: "from-amber-600 to-orange-700",
  },
  {
    id: "connections",
    title: "Connections",
    description: "Group 16 words into 4 categories of four related words without making more than 4 mistakes.",
    gameUrl: "https://www.nytimes.com/games/connections",
    isDaily: true,
    categoryType: "grouping_deduction",
    categoryConfig: { totalGroups: 4, maxMistakes: 4 },
    category: "Grouping & Deduction",
    iconUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 4,
    isActive: true,
    colorTheme: "from-purple-500 to-pink-600",
  },
  {
    id: "contexto",
    title: "Contexto",
    description: "Find the secret word by testing semantic proximity using an advanced artificial intelligence context engine.",
    gameUrl: "https://contexto.me/",
    isDaily: true,
    categoryType: "unlimited_steps",
    categoryConfig: { stepMetricLabel: "Guesses" },
    category: "Unlimited Steps / Ladder",
    iconUrl: "https://images.unsplash.com/photo-1516116211227-bbc13c233374?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 25,
    isActive: true,
    colorTheme: "from-amber-500 to-yellow-600",
  },
  {
    id: "semantle",
    title: "Semantle",
    description: "Guess the mystery word by searching for semantic similarities measured by Word2Vec cosine distance.",
    gameUrl: "https://semantle.com/",
    isDaily: true,
    categoryType: "unlimited_steps",
    categoryConfig: { stepMetricLabel: "Guesses" },
    category: "Unlimited Steps / Ladder",
    iconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 30,
    isActive: true,
    colorTheme: "from-rose-500 to-red-700",
  },
  {
    id: "victordle",
    title: "Victordle",
    description: "Competitive real-time multiplayer Wordle battle against players and bots. Race to solve first.",
    gameUrl: "https://victordle.com/",
    isDaily: false,
    categoryType: "competitive_match",
    categoryConfig: {},
    category: "Competitive / Match",
    iconUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 6,
    isActive: true,
    colorTheme: "from-red-500 to-orange-600",
  },
  {
    id: "squabble",
    title: "Squabble",
    description: "Fast-paced Battle Royale word game. Correct letters damage opponents while mistakes drain your health bar.",
    gameUrl: "https://squabble.me/",
    isDaily: false,
    categoryType: "competitive_match",
    categoryConfig: {},
    category: "Competitive / Match",
    iconUrl: "https://images.unsplash.com/photo-1534423861386-85a16f5d1345?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 6,
    isActive: true,
    colorTheme: "from-rose-600 to-red-800",
  },
  {
    id: "spelltower-daily",
    title: "SpellTower Daily",
    description: "Strategic tile-clearing word finding game. Construct long words to clear the rising tower for max high score.",
    gameUrl: "https://spelltower.com/",
    isDaily: true,
    categoryType: "high_score_timed",
    categoryConfig: { scoreType: "Points" },
    category: "High Score / Timed",
    iconUrl: "https://images.unsplash.com/photo-1516116211227-bbc13c233374?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 10,
    isActive: true,
    colorTheme: "from-sky-500 to-indigo-600",
  },
  {
    id: "blossom",
    title: "Blossom Word Game",
    description: "Form words from petals around a central letter. Each petal bonus multiplies your overall vocabulary score.",
    gameUrl: "https://merriam-webster.com/games/blossom-word-game",
    isDaily: true,
    categoryType: "high_score_timed",
    categoryConfig: { scoreType: "Points" },
    category: "High Score / Timed",
    iconUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 12,
    isActive: true,
    colorTheme: "from-pink-500 to-rose-600",
  },
];

export const EXTRA_WORD_GAMES: Omit<Game, "createdAt" | "updatedAt">[] = [
  {
    id: "weaver",
    title: "Weaver",
    description: "Word ladder challenge: transform the start word into the target word by changing one letter at a time.",
    gameUrl: "https://wordwormdorm.com/",
    isDaily: true,
    categoryType: "unlimited_steps",
    categoryConfig: { stepMetricLabel: "Steps" },
    category: "Unlimited Steps / Ladder",
    iconUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 8,
    isActive: true,
    colorTheme: "from-amber-600 to-orange-700",
  },
  {
    id: "waffle",
    title: "Waffle",
    description: "Rearrange the letters on a waffle grid to spell 6 intersecting words in 15 swaps or fewer.",
    gameUrl: "https://wafflegame.net/",
    isDaily: true,
    categoryType: "classic_single",
    categoryConfig: { maxAttempts: 15 },
    category: "Classic Single-Board",
    iconUrl: "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 15,
    isActive: true,
    colorTheme: "from-orange-500 to-amber-600",
  },
  {
    id: "sedecordle",
    title: "Sedecordle",
    description: "The gigantic 16-word challenge! Solve 16 Wordle grids simultaneously in 21 attempts.",
    gameUrl: "https://www.sedecordle.com/",
    isDaily: true,
    categoryType: "multi_board",
    categoryConfig: { totalBoards: 16, maxAttempts: 21 },
    category: "Multi-Board Grid",
    iconUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 21,
    isActive: true,
    colorTheme: "from-violet-600 to-indigo-800",
  },
  {
    id: "absurdle",
    title: "Absurdle",
    description: "An adversarial casual practice version of Wordle where the game actively changes the secret word endlessly.",
    gameUrl: "https://qntm.org/files/absurdle/absurdle.html",
    isDaily: false,
    categoryType: "unlimited_steps",
    categoryConfig: { stepMetricLabel: "Guesses" },
    category: "Unlimited Steps / Ladder",
    iconUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 10,
    isActive: true,
    colorTheme: "from-red-600 to-rose-800",
  },
  {
    id: "wordle-cup",
    title: "Wordle Cup",
    description: "Fast-paced tournament style multiplayer word guessing challenge with custom time limits and live rounds.",
    gameUrl: "https://wordlecup.io/",
    isDaily: false,
    categoryType: "competitive_match",
    categoryConfig: {},
    category: "Competitive / Match",
    iconUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 6,
    isActive: true,
    colorTheme: "from-purple-600 to-pink-600",
  },
  {
    id: "swapple",
    title: "Swapple",
    description: "Daily grouping and letter swap puzzle with limited allowed deduction mistakes.",
    gameUrl: "https://swapple.app/",
    isDaily: true,
    categoryType: "grouping_deduction",
    categoryConfig: { totalGroups: 4, maxMistakes: 4 },
    category: "Grouping & Deduction",
    iconUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 4,
    isActive: true,
    colorTheme: "from-indigo-600 to-violet-700",
  },
  {
    id: "squaredle",
    title: "Squaredle",
    description: "Find all valid words hidden in a 4x4 or 5x5 letter grid by connecting adjacent letters in any direction.",
    gameUrl: "https://squaredle.app/",
    isDaily: true,
    categoryType: "high_score_timed",
    categoryConfig: { scoreType: "Words" },
    category: "High Score / Timed",
    iconUrl: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 10,
    isActive: true,
    colorTheme: "from-cyan-500 to-blue-600",
  },
  {
    id: "phrazle",
    title: "Phrazle",
    description: "Guess the full mystery phrase across multiple words in 6 attempts with letter position clues.",
    gameUrl: "https://solitaired.com/phrazle",
    isDaily: true,
    categoryType: "classic_single",
    categoryConfig: { maxAttempts: 6 },
    category: "Classic Single-Board",
    iconUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=128&auto=format&fit=crop&q=80",
    maxAttempts: 6,
    isActive: true,
    colorTheme: "from-emerald-600 to-teal-700",
  },
];

/**
 * Returns 10 new unique word games that do not already exist in the catalog
 */
export function get10NewUniqueGames(existingGames: Game[]): Game[] {
  const existingIds = new Set(existingGames.map((g) => g.id.toLowerCase()));
  const existingTitles = new Set(existingGames.map((g) => g.title.toLowerCase().trim()));

  const allAvailable = [...INITIAL_GAMES, ...EXTRA_WORD_GAMES];
  const newGames: Game[] = [];

  // 1. Pick from curated catalog first
  for (const game of allAvailable) {
    if (!existingIds.has(game.id.toLowerCase()) && !existingTitles.has(game.title.toLowerCase().trim())) {
      newGames.push({
        ...game,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      existingIds.add(game.id.toLowerCase());
      existingTitles.add(game.title.toLowerCase().trim());
      if (newGames.length === 10) break;
    }
  }

  return newGames;
}

/**
 * Populates Firestore with the initial catalog of popular word games
 */
export async function seedGamesDatabase(forceOverwrite = false): Promise<{ seeded: number; skipped: number }> {
  try {
    const gamesSnapshot = await getDocs(collection(db, "games"));
    const existingCount = gamesSnapshot.size;

    if (existingCount > 0 && !forceOverwrite) {
      return { seeded: 0, skipped: existingCount };
    }

    let seededCount = 0;
    for (const game of INITIAL_GAMES) {
      const docRef = doc(db, "games", game.id);
      await setDoc(
        docRef,
        {
          ...game,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      seededCount++;
    }

    return { seeded: seededCount, skipped: 0 };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "games");
  }
}
