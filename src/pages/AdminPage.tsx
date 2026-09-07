import React, { useState, useEffect } from "react";
import { Game, CategoryItem } from "../types";
import { GameManagementTable } from "../components/admin/GameManagementTable";
import { CategoryManagementSection } from "../components/admin/CategoryManagementSection";
import { SubmissionsReviewTable } from "../components/admin/SubmissionsReviewTable";
import { subscribeToAllSubmissionsAdmin } from "../services/submissions.service";
import {
  Gamepad2,
  Tag,
  Send,
  Shield,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";

interface AdminPageProps {
  allGames: Game[];
  categories: CategoryItem[];
  onRefreshGames: () => Promise<void> | void;
  onRefreshCategories: () => Promise<void> | void;
  onGamesUpdated: (games: Game[]) => void;
}

export type AdminTab = "games" | "categories" | "submissions";

export const AdminPage: React.FC<AdminPageProps> = ({
  allGames,
  categories,
  onRefreshGames,
  onRefreshCategories,
  onGamesUpdated,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>("games");
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState<number>(0);

  // Subscribe to submissions count for notification badge
  useEffect(() => {
    const unsub = subscribeToAllSubmissionsAdmin((subs) => {
      const pending = subs.filter((s) => s.status === "pending").length;
      setPendingSubmissionsCount(pending);
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-2">
      {/* Admin Header */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Administrator Control Center
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Manage the game catalog, customize category taxonomies, and review community game suggestions.
          </p>
        </div>

        {/* 3 Main Admin Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
          <button
            id="admin-tab-games"
            type="button"
            onClick={() => setActiveAdminTab("games")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === "games"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Game Catalog ({allGames.length})</span>
          </button>

          <button
            id="admin-tab-categories"
            type="button"
            onClick={() => setActiveAdminTab("categories")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === "categories"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            id="admin-tab-submissions"
            type="button"
            onClick={() => setActiveAdminTab("submissions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === "submissions"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/50"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>User Submissions</span>
            {pendingSubmissionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Game Catalog Management */}
      {activeAdminTab === "games" && (
        <div className="animate-in fade-in duration-200">
          <GameManagementTable
            games={allGames}
            categories={categories}
            onRefresh={onRefreshGames}
          />
        </div>
      )}

      {/* Tab 2: Category Management */}
      {activeAdminTab === "categories" && (
        <div className="animate-in fade-in duration-200">
          <CategoryManagementSection
            categories={categories}
            games={allGames}
            onGamesUpdated={onGamesUpdated}
            onRefresh={async () => {
              await onRefreshCategories();
              await onRefreshGames();
            }}
          />
        </div>
      )}

      {/* Tab 3: User Submissions Review */}
      {activeAdminTab === "submissions" && (
        <div className="animate-in fade-in duration-200">
          <SubmissionsReviewTable
            categories={categories}
            onGameApproved={async () => {
              await onRefreshGames();
            }}
          />
        </div>
      )}
    </div>
  );
};
