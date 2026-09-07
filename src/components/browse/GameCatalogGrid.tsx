import React, { useState, useMemo } from "react";
import { Game, CategoryItem } from "../../types";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { GameCard } from "./GameCard";
import { useFavorites } from "../../hooks/useFavorites";
import { Compass, Sparkles, Filter } from "lucide-react";

interface GameCatalogGridProps {
  games: Game[];
  categories?: CategoryItem[];
  onLogScore: (game: Game) => void;
}

export const GameCatalogGrid: React.FC<GameCatalogGridProps> = ({
  games,
  categories = [],
  onLogScore,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Games");
  const { isFavorited, toggleFavorite } = useFavorites();

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: games.length };
    games.forEach((g) => {
      counts[g.category] = (counts[g.category] || 0) + 1;
    });
    return counts;
  }, [games]);

  // Unique category names from active games
  const availableCategoryNames = useMemo(() => {
    return Array.from(new Set(games.map((g) => g.category))).filter(Boolean);
  }, [games]);

  // Filtered games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (game.isActive === false) return false;

      // Category matching
      if (selectedCategory !== "All Games" && game.category !== selectedCategory) {
        return false;
      }

      // Search query matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = game.title.toLowerCase().includes(q);
        const descMatch = game.description.toLowerCase().includes(q);
        const catMatch = game.category.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }

      return true;
    });
  }, [games, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Game Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explore Online Word Games
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Browse the curated catalog of daily word challenges. Star any game to track your daily progress directly on your Home Dashboard.
        </p>
      </div>

      {/* Controls: Search + Categories */}
      <div className="space-y-4 pt-2">
        <div className="max-w-md">
          <SearchBar query={searchQuery} onChange={setSearchQuery} />
        </div>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          categories={categories}
          availableCategoryNames={availableCategoryNames}
        />
      </div>

      {/* Results Meta */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
        <span>Showing {filteredGames.length} of {games.length} games</span>
        {selectedCategory !== "All Games" && (
          <span className="text-emerald-400">Filtered by {selectedCategory}</span>
        )}
      </div>

      {/* Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              categories={categories}
              isFavorited={isFavorited(game.id)}
              onToggleFavorite={toggleFavorite}
              onLogScore={onLogScore}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center space-y-3">
          <p className="text-base font-semibold text-white">No games found matching "{searchQuery}"</p>
          <p className="text-xs text-slate-400">
            Try adjusting your search keywords or resetting the category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All Games");
            }}
            className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};

