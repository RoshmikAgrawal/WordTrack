import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Game, GameLog, DailyTrackerItem } from "../types";
import { subscribeToDailyLogs, deleteGameLog } from "../services/logs.service";
import { getLocalDateISO } from "../lib/utils";

export function useTracker(allGames: Game[]) {
  const { user, favoriteGameIds } = useAuth();
  const todayDate = useMemo(() => getLocalDateISO(), []);
  const [todayLogs, setTodayLogs] = useState<GameLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [activeModalGame, setActiveModalGame] = useState<Game | null>(null);
  const [editingLog, setEditingLog] = useState<GameLog | undefined>(undefined);

  // Subscribe to today's logs for logged-in user
  useEffect(() => {
    if (!user) {
      // Local fallback for guest user from localStorage
      try {
        const local = localStorage.getItem(`wordtrack_logs_${todayDate}`);
        if (local) {
          setTodayLogs(JSON.parse(local));
        } else {
          setTodayLogs([]);
        }
      } catch {
        setTodayLogs([]);
      }
      setLoadingLogs(false);
      return;
    }

    setLoadingLogs(true);
    const unsubscribe = subscribeToDailyLogs(
      user.uid,
      todayDate,
      (logs) => {
        setTodayLogs(logs);
        setLoadingLogs(false);
      },
      () => {
        setLoadingLogs(false);
      }
    );

    return () => unsubscribe();
  }, [user, todayDate]);

  // Separate Favorited Games into Daily vs Casual
  const { favoritedDailyGames, favoritedCasualGames } = useMemo(() => {
    const favorited = allGames.filter(
      (game) => favoriteGameIds.includes(game.id) && game.isActive !== false
    );

    const daily: Game[] = [];
    const casual: Game[] = [];

    favorited.forEach((g) => {
      if (g.isDaily !== false) {
        daily.push(g);
      } else {
        casual.push(g);
      }
    });

    return {
      favoritedDailyGames: daily,
      favoritedCasualGames: casual,
    };
  }, [allGames, favoriteGameIds]);

  // Categorize Daily games into Remaining vs Completed
  const { remainingGames, completedItems } = useMemo(() => {
    const logMap = new Map<string, GameLog>();
    todayLogs.forEach((log) => {
      logMap.set(log.gameId, log);
    });

    const remaining: Game[] = [];
    const completed: DailyTrackerItem[] = [];

    favoritedDailyGames.forEach((game) => {
      const log = logMap.get(game.id);
      if (log) {
        completed.push({
          game,
          log,
          isCompleted: true,
        });
      } else {
        remaining.push(game);
      }
    });

    return {
      remainingGames: remaining,
      completedItems: completed,
    };
  }, [favoritedDailyGames, todayLogs]);

  const totalFavorited = favoritedDailyGames.length;
  const completedCount = completedItems.length;
  const progressPercent = totalFavorited > 0 ? Math.round((completedCount / totalFavorited) * 100) : 0;

  const openScoreModal = (game: Game, existingLog?: GameLog) => {
    // Only daily games can be logged
    if (game.isDaily === false) return;
    setActiveModalGame(game);
    setEditingLog(existingLog);
  };

  const closeScoreModal = () => {
    setActiveModalGame(null);
    setEditingLog(undefined);
  };

  // Optimistic handler when a log is saved
  const onLogSavedLocally = (savedLog: GameLog) => {
    setTodayLogs((prev) => {
      const index = prev.findIndex((l) => l.gameId === savedLog.gameId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = savedLog;
        return next;
      }
      return [savedLog, ...prev];
    });

    // Save to local storage for guests
    if (!user) {
      try {
        const updated = todayLogs.filter((l) => l.gameId !== savedLog.gameId);
        updated.push(savedLog);
        localStorage.setItem(`wordtrack_logs_${todayDate}`, JSON.stringify(updated));
      } catch (e) {
        console.error("Local storage error:", e);
      }
    }
  };

  // Handler to delete/unlog a score
  const deleteLog = async (gameId: string) => {
    if (user) {
      try {
        await deleteGameLog(user.uid, gameId, todayDate);
      } catch (e) {
        console.error("Failed to delete log in Firestore:", e);
      }
    }

    setTodayLogs((prev) => prev.filter((l) => l.gameId !== gameId));

    if (!user) {
      try {
        const updated = todayLogs.filter((l) => l.gameId !== gameId);
        localStorage.setItem(`wordtrack_logs_${todayDate}`, JSON.stringify(updated));
      } catch (e) {
        console.error("Local storage error:", e);
      }
    }
  };

  return {
    todayDate,
    favoritedDailyGames,
    favoritedCasualGames,
    remainingGames,
    completedItems,
    todayLogs,
    totalFavorited,
    completedCount,
    progressPercent,
    loadingLogs,
    activeModalGame,
    editingLog,
    openScoreModal,
    closeScoreModal,
    onLogSavedLocally,
    deleteLog,
  };
}
