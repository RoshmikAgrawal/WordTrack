import React, { useState } from "react";
import { Game, CategoryItem, GameCategoryType, CATEGORY_DEFINITIONS } from "../types";
import { GameCard } from "../components/browse/GameCard";
import { ScoreLogModal } from "../components/dashboard/ScoreLogModal";
import { useAuth } from "../context/AuthContext";
import { getLocalDateISO } from "../lib/utils";
import {
  Search,
  SlidersHorizontal,
  Compass,
  Sparkles,
  Zap,
  Gamepad2,
  Filter,
} from "lucide-react";

interface BrowsePageProps {
  games: Game[];
  categories: CategoryItem[];
}

export const BrowsePage: React.FC<BrowsePageProps> = ({ games, categories }) => {
  const { favoriteGameIds, toggleFavorite } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "daily" | "casual">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [activeModalGame, setActiveModalGame] = useState<Game | null>(null);

  const todayDate = getLocalDateISO();

  // Filter games based on search, type (daily vs casual), and category
  const filteredGames = games.filter((game) => {
    if (game.isActive === false) return false;

    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const isDaily = game.isDaily !== false;
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "daily" ? isDaily : !isDaily);

    const catType = game.categoryType || "classic_single";
    const matchesCat =
      selectedCategory === "all" ||
      catType === selectedCategory ||
      game.category === selectedCategory;

    return matchesSearch && matchesType && matchesCat;
  });

  const dailyCount = games.filter((g) => g.isDaily !== false && g.isActive !== false).length;
  const casualCount = games.filter((g) => g.isDaily === false && g.isActive !== false).length;

  return (
    <div className="space-y-6 animate-fade-in pb-2">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold py-1 px-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full">
            <Compass className="w-3.5 h-3.5" />
            <span>Discover & Curate</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Word Game Catalog<span className="text-emerald-400">.</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Browse our curated collection of daily challenges and casual practice games. Star your favorites to build your personalized daily tracker.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="browse-search-input"
              type="text"
              placeholder="Search word games by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Classification Filter Tabs (All / Daily / Casual) */}
          <div className="w-full max-w-full overflow-x-auto scrollbar-none md:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-slate-800 self-start md:self-auto min-w-max">
              <button
                onClick={() => setTypeFilter("all")}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === "all"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All ({games.length})
              </button>
              <button
                onClick={() => setTypeFilter("daily")}
                className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === "daily"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-emerald-400"
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Daily Challenges ({dailyCount})</span>
              </button>
              <button
                onClick={() => setTypeFilter("casual")}
                className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === "casual"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-indigo-400"
                }`}
              >
                <Gamepad2 className="w-3 h-3" />
                <span>Casual & Practice ({casualCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Category:</span>
          </span>

          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            All Categories
          </button>

          {/* Category buttons dynamic */}
          {(categories && categories.length > 0
            ? categories.map((cat) => ({ key: cat.id, label: cat.name }))
            : Object.entries(CATEGORY_DEFINITIONS).map(([key, def]) => ({ key, label: def.label }))
          ).map(({ key, label }) => {
            const isSelected = selectedCategory === key;
            const count = games.filter(
              (g) =>
                ((g.categoryType || "classic_single") === key ||
                  g.category?.toLowerCase() === label.toLowerCase()) &&
                g.isActive !== false
            ).length;

            if (count === 0) return null;

            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Games Catalog Grid */}
      {filteredGames.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-300">No games matched your filter criteria.</p>
          <p className="text-xs text-slate-500">Try clearing the search or switching category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              categories={categories}
              isFavorited={favoriteGameIds.includes(game.id)}
              onToggleFavorite={() => toggleFavorite(game.id)}
              onLogScore={(g) => setActiveModalGame(g)}
            />
          ))}
        </div>
      )}

      {/* Score Modal */}
      {activeModalGame && (
        <ScoreLogModal
          isOpen={!!activeModalGame}
          onClose={() => setActiveModalGame(null)}
          game={activeModalGame}
          playedDate={todayDate}
          categories={categories}
          onLogSaved={() => {
            setActiveModalGame(null);
          }}
        />
      )}
    </div>
  );
};
