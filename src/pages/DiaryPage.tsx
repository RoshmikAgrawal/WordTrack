import React, { useState, useMemo } from "react";
import { Game, GameLog, CategoryItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { StatsDashboard } from "../components/diary/StatsDashboard";
import { DiaryCalendar } from "../components/diary/DiaryCalendar";
import { DailyLogSummary } from "../components/diary/DailyLogSummary";
import { ScoreLogModal } from "../components/dashboard/ScoreLogModal";
import { deleteGameLog } from "../services/logs.service";
import { getLocalDateISO } from "../lib/utils";
import { Lock, ArrowRight, BookOpen } from "lucide-react";

interface DiaryPageProps {
  allGames: Game[];
  userLifetimeLogs: GameLog[];
  lifetimeStats: any;
  categories?: CategoryItem[];
  onRefreshLogs?: () => void;
}

export const DiaryPage: React.FC<DiaryPageProps> = ({
  allGames,
  userLifetimeLogs,
  lifetimeStats,
  categories,
  onRefreshLogs,
}) => {
  const { user, openAuthModal } = useAuth();
  const [selectedDiaryDate, setSelectedDiaryDate] = useState<string>(() => getLocalDateISO());
  const [activeModalGame, setActiveModalGame] = useState<Game | null>(null);
  const [editingLog, setEditingLog] = useState<GameLog | undefined>(undefined);

  // Group lifetime logs by date for Diary calendar dots
  const logsByDate = useMemo(() => {
    const map: Record<string, { total: number; solved: number; failed: number }> = {};
    userLifetimeLogs.forEach((log) => {
      if (!map[log.playedDate]) {
        map[log.playedDate] = { total: 0, solved: 0, failed: 0 };
      }
      map[log.playedDate].total += 1;
      if (log.status === "solved") map[log.playedDate].solved += 1;
      if (log.status === "failed") map[log.playedDate].failed += 1;
    });
    return map;
  }, [userLifetimeLogs]);

  // Logs for the currently selected diary date
  const selectedDateLogs = useMemo(() => {
    return userLifetimeLogs.filter((l) => l.playedDate === selectedDiaryDate);
  }, [userLifetimeLogs, selectedDiaryDate]);

  const handleRequestScoreLog = (game: Game, log?: GameLog) => {
    if (!user) {
      openAuthModal(
        "login",
        `Sign in to record your score for "${game.title}" to your permanent diary and maintain streaks.`
      );
      return;
    }
    setActiveModalGame(game);
    setEditingLog(log);
  };

  const handleDeleteLogs = async (gameIds: string[]) => {
    if (user) {
      try {
        await Promise.all(
          gameIds.map((gameId) => deleteGameLog(user.uid, gameId, selectedDiaryDate))
        );
      } catch (err) {
        console.error("Error deleting logs:", err);
      }
    } else {
      try {
        const localKey = `wordtrack_logs_${selectedDiaryDate}`;
        const local = localStorage.getItem(localKey);
        if (local) {
          const parsed: GameLog[] = JSON.parse(local);
          const filtered = parsed.filter((l) => !gameIds.includes(l.gameId));
          localStorage.setItem(localKey, JSON.stringify(filtered));
        }
      } catch (err) {
        console.error("Guest delete error:", err);
      }
    }

    if (onRefreshLogs) {
      onRefreshLogs();
    }
  };

  // Only daily games can be logged in diary
  const loggableGames = allGames.filter((g) => g.isDaily !== false && g.isActive !== false);

  return (
    <div className="space-y-6 animate-fade-in pb-2">
      {/* Guest Notice */}
      {!user && (
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sign In to Save Your Daily Word Game Journal</h3>
              <p className="text-xs text-slate-400">
                Sign in with Google or Email to preserve daily streaks, record past solutions, and sync lifetime analytics across devices.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              openAuthModal(
                "login",
                "Sign in to record your puzzle results and access your lifetime diary history."
              )
            }
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Top Lifetime Stats */}
      <StatsDashboard stats={lifetimeStats} />

      {/* Calendar & Selected Date Summary (Stacked Full-Width) */}
      <div className="space-y-6">
        <div className="w-full">
          <DiaryCalendar
            selectedDate={selectedDiaryDate}
            onSelectDate={setSelectedDiaryDate}
            logsByDate={logsByDate}
          />
        </div>

        <div className="w-full">
          <DailyLogSummary
            date={selectedDiaryDate}
            logs={selectedDateLogs}
            allGames={allGames}
            categories={categories}
            onLogNewScore={() => {
              if (loggableGames.length > 0) {
                handleRequestScoreLog(loggableGames[0]);
              }
            }}
            onEditLog={(game, log) => handleRequestScoreLog(game, log)}
            onDeleteLogs={handleDeleteLogs}
          />
        </div>
      </div>

      {/* Score Modal */}
      {activeModalGame && (
        <ScoreLogModal
          isOpen={!!activeModalGame}
          onClose={() => {
            setActiveModalGame(null);
            setEditingLog(undefined);
          }}
          game={activeModalGame}
          playedDate={selectedDiaryDate}
          existingLog={editingLog}
          categories={categories}
          onLogSaved={() => {
            setActiveModalGame(null);
            setEditingLog(undefined);
            if (onRefreshLogs) onRefreshLogs();
          }}
        />
      )}
    </div>
  );
};
