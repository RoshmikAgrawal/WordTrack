import React from "react";
import { Game, CategoryItem } from "../../types";
import { Button } from "../ui";
import { getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";
import { Star, Play, CheckCircle, Zap } from "lucide-react";

interface RemainingGamesListProps {
  games: Game[];
  categories?: CategoryItem[];
  onLogScore: (game: Game) => void;
  onToggleFavorite?: (gameId: string) => void;
}

export const RemainingGamesList: React.FC<RemainingGamesListProps> = ({
  games,
  categories,
  onLogScore,
  onToggleFavorite,
}) => {
  if (games.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Remaining Today ({games.length})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map((game) => {
          const catType = game.categoryType || "classic_single";
          const catStyle = getCategoryBadgeStyle(catType, categories);
          const catLabel = getCategoryTypeLabel(catType, categories, game.category);

          return (
            <div
              key={game.id}
              id={`remaining-game-${game.id}`}
              className="group relative rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 p-6 backdrop-blur-xl shadow-xl shadow-black/30 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:bg-slate-900/60"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  {/* Game Icon & Title */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-emerald-500/40 transition-colors shadow-inner">
                      {game.iconUrl ? (
                        <img
                          src={game.iconUrl}
                          alt={game.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {game.title.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                        <span>{game.title}</span>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {catLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Star unstar toggle */}
                  {onToggleFavorite && (
                    <button
                      id={`unstar-btn-${game.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onToggleFavorite(game.id);
                      }}
                      className="p-2.5 rounded-2xl text-amber-400 bg-amber-500/15 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30 border border-amber-500/30 transition-all cursor-pointer group/star shadow-md shadow-amber-950/40"
                      title="Remove from Daily Tracker"
                      aria-label={`Remove ${game.title} from Daily Tracker`}
                    >
                      <Star className="w-4 h-4 fill-amber-400 group-hover/star:fill-rose-400 group-hover/star:stroke-rose-400 transition-colors" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2.5">
                <a
                  href={game.gameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Play</span>
                </a>

                <Button
                  id={`log-score-btn-${game.id}`}
                  variant="outline"
                  size="sm"
                  onClick={() => onLogScore(game)}
                  className="flex-1 text-xs font-bold rounded-xl border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Log Score</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
