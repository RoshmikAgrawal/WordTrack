import React, { useState } from "react";
import { Game, CategoryItem } from "../types";
import { useTracker } from "../hooks/useTracker";
import { useAuth } from "../context/AuthContext";
import { TrackerHeader } from "../components/dashboard/TrackerHeader";
import { RemainingGamesList } from "../components/dashboard/RemainingGamesList";
import { CompletedGamesList } from "../components/dashboard/CompletedGamesList";
import { CasualGamesList } from "../components/dashboard/CasualGamesList";
import { ScoreLogModal } from "../components/dashboard/ScoreLogModal";
import { Button } from "../components/ui";
import {
  Compass,
  Sparkles,
  Zap,
  Gamepad2,
  Lock,
  ArrowRight,
  HelpCircle,
  Layers,
} from "lucide-react";

interface DashboardPageProps {
  games: Game[];
  categories: CategoryItem[];
  streakCount: number;
  onNavigateToBrowse: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  games,
  categories,
  streakCount,
  onNavigateToBrowse,
}) => {
  const { user, toggleFavorite, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<"daily" | "casual">("daily");

  const {
    todayDate,
    favoritedDailyGames,
    favoritedCasualGames,
    remainingGames,
    completedItems,
    totalFavorited,
    completedCount,
    progressPercent,
    activeModalGame,
    editingLog,
    openScoreModal,
    closeScoreModal,
    onLogSavedLocally,
    deleteLog,
  } = useTracker(games);

  const handleToggleFavorite = async (gameId: string) => {
    try {
      await toggleFavorite(gameId);
    } catch (e) {
      console.error("Favorite toggle error:", e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-2">
      {/* 1. Header & Bento Spotlight (Always visible on Home page) */}
      <TrackerHeader
        todayDate={todayDate}
        completedCount={completedCount}
        totalFavorited={totalFavorited}
        progressPercent={progressPercent}
        onBrowseClick={onNavigateToBrowse}
      />

      {/* 2. Top-Level Tab Switcher: Daily Challenges vs Other Games */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-800 self-start">
          {/* Daily Challenges Tab */}
          <button
            id="tab-daily-challenges-btn"
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "daily"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Daily Challenges</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "daily"
                  ? "bg-slate-950 text-emerald-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {favoritedDailyGames.length}
            </span>
          </button>

          {/* Casual & Practice Tab */}
          <button
            id="tab-casual-games-btn"
            type="button"
            onClick={() => setActiveTab("casual")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "casual"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Other Games</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "casual"
                  ? "bg-slate-950 text-indigo-300"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {favoritedCasualGames.length}
            </span>
          </button>
        </div>

        {/* Explore link helper */}
        <button
          onClick={onNavigateToBrowse}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore Full Catalog ({games.length} games)</span>
        </button>
      </div>

      {/* Guest notice banner if logged out */}
      {!user && (
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Guest Mode Active</h4>
              <p className="text-xs text-slate-400">
                Log in to sync your score diary across devices, protect your streaks, and save custom favorites.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              openAuthModal("login", "Sign in with Google or Email to unlock permanent daily score journal tracking.")
            }
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-md shadow-emerald-500/20 self-start sm:self-auto"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ================= TAB 1: DAILY CHALLENGES ================= */}
      {activeTab === "daily" && (
        <div className="space-y-8">
          {favoritedDailyGames.length === 0 ? (
            /* Empty State: No daily games favorited */
            <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-8 sm:p-14 text-center space-y-4 backdrop-blur-xl">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <Zap className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">No Games Added Yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You haven't starred any daily word games yet. Star games from the catalog to create your personal daily puzzle routine.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={onNavigateToBrowse}
                className="mt-2 text-xs font-bold"
              >
                <Compass className="w-4 h-4" />
                <span>Browse Daily Word Games</span>
              </Button>
            </div>
          ) : (
            <>
              {/* 1. Remaining Daily Games */}
              <RemainingGamesList
                games={remainingGames}
                categories={categories}
                onLogScore={(game) => openScoreModal(game)}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* 2. Completed Daily Games */}
              <CompletedGamesList
                items={completedItems}
                categories={categories}
                onEditScore={(game, log) => openScoreModal(game, log)}
                onDeleteScore={(game) => deleteLog(game.id)}
              />
            </>
          )}
        </div>
      )}

      {/* ================= TAB 2: CASUAL / PRACTICE ================= */}
      {activeTab === "casual" && (
        <div className="space-y-6">
          <CasualGamesList
            games={favoritedCasualGames}
            categories={categories}
            onToggleFavorite={handleToggleFavorite}
            onExploreCatalog={onNavigateToBrowse}
          />
        </div>
      )}

      {/* Score Logging Modal */}
      {activeModalGame && (
        <ScoreLogModal
          isOpen={!!activeModalGame}
          onClose={closeScoreModal}
          game={activeModalGame}
          playedDate={todayDate}
          existingLog={editingLog}
          categories={categories}
          onLogSaved={onLogSavedLocally}
        />
      )}
    </div>
  );
};
