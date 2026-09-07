import React from "react";
import { Game, CategoryItem } from "../../types";
import { getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";
import { Gamepad2, Star, Play, ExternalLink, Compass } from "lucide-react";

interface CasualGamesListProps {
  games: Game[];
  categories?: CategoryItem[];
  onToggleFavorite?: (gameId: string) => void;
  onExploreCatalog?: () => void;
}

export const CasualGamesList: React.FC<CasualGamesListProps> = ({
  games,
  categories,
  onToggleFavorite,
  onExploreCatalog,
}) => {
  if (games.length === 0) {
    return (
      <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-8 sm:p-12 text-center space-y-4 backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <Gamepad2 className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-bold text-white">No Games Added Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Star practice modes, word puzzles, or multiplayer games from the Explore catalog for quick launch access anytime.
          </p>
        </div>
        {onExploreCatalog && (
          <button
            onClick={onExploreCatalog}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/50 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Browse Casual Games</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Games Added ({games.length})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map((game) => {
          const catType = game.categoryType || "competitive_match";
          const catStyle = getCategoryBadgeStyle(catType, categories);
          const catLabel = getCategoryTypeLabel(catType, categories, game.category);

          return (
            <div
              key={game.id}
              id={`casual-game-${game.id}`}
              className="group relative rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 p-6 backdrop-blur-xl shadow-xl shadow-black/30 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:bg-slate-900/60"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-indigo-500/40 transition-colors shadow-inner">
                      {game.iconUrl ? (
                        <img
                          src={game.iconUrl}
                          alt={game.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-lg font-black text-indigo-400 font-mono">
                          {game.title.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                        <span>{game.title}</span>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {catLabel}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <Gamepad2 className="w-2.5 h-2.5" />
                          <span>Casual</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {onToggleFavorite && (
                    <button
                      id={`unstar-casual-btn-${game.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onToggleFavorite(game.id);
                      }}
                      className="p-2.5 rounded-2xl text-amber-400 bg-amber-500/15 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30 border border-amber-500/30 transition-all cursor-pointer group/star shadow-md shadow-amber-950/40"
                      title="Remove from Casual Favorites"
                      aria-label={`Remove ${game.title} from Casual Favorites`}
                    >
                      <Star className="w-4 h-4 fill-amber-400 group-hover/star:fill-rose-400 group-hover/star:stroke-rose-400 transition-colors" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Direct Play Action */}
              <div className="pt-4 border-t border-slate-800/80">
                <a
                  href={game.gameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Play</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
