import React from "react";
import { Game, CategoryItem } from "../../types";
import { Button } from "../ui";
import { getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";
import { Star, Play, CheckCircle, Zap, Gamepad2 } from "lucide-react";

interface GameCardProps {
  game: Game;
  categories?: CategoryItem[];
  isFavorited: boolean;
  onToggleFavorite: (gameId: string, e: React.MouseEvent) => void;
  onLogScore: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  categories,
  isFavorited,
  onToggleFavorite,
  onLogScore,
}) => {
  const catType = game.categoryType || "classic_single";
  const catStyle = getCategoryBadgeStyle(catType, categories);
  const catLabel = getCategoryTypeLabel(catType, categories, game.category);
  const isDaily = game.isDaily !== false;

  return (
    <div
      id={`catalog-game-card-${game.id}`}
      className="group relative rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 p-6 backdrop-blur-xl shadow-xl shadow-black/30 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:bg-slate-900/60"
    >
      <div>
        {/* Header: Icon, Title, Classification & Star Button */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-emerald-500/40 transition-colors shadow-inner">
              {game.iconUrl ? (
                <img
                  src={game.iconUrl}
                  alt={game.title}
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
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
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                >
                  {catLabel}
                </span>

                {isDaily ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    <Zap className="w-2.5 h-2.5" />
                    <span>Daily</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                    <Gamepad2 className="w-2.5 h-2.5" />
                    <span>Casual</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Star Button */}
          <button
            id={`star-btn-${game.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleFavorite(game.id, e);
            }}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isFavorited
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-md shadow-amber-950/40"
                : "bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700"
            }`}
            title={
              isFavorited
                ? "Remove from Favorites"
                : isDaily
                ? "Star to track on Home Daily Tracker"
                : "Star for 1-Click Launch"
            }
            aria-label={isFavorited ? `Remove ${game.title} from favorites` : `Star ${game.title}`}
          >
            <Star
              className={`w-4 h-4 transition-all duration-200 ${
                isFavorited
                  ? "fill-amber-400 stroke-amber-400 scale-110"
                  : "stroke-slate-400 group-hover:stroke-slate-200"
              }`}
            />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
          {game.description}
        </p>

        {/* Category Rules Info */}
        <div className="flex items-center gap-2 mb-4 text-[11px] text-slate-400 font-mono">
          {catType === "classic_single" && (
            <span className="bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
              Guesses: <strong className="text-slate-200">{game.categoryConfig?.maxAttempts || game.maxAttempts || 6}</strong>
            </span>
          )}
          {catType === "multi_board" && (
            <span className="bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
              {game.categoryConfig?.totalBoards || 4} Boards / {game.categoryConfig?.maxAttempts || 9} Tries
            </span>
          )}
          {catType === "unlimited_steps" && (
            <span className="bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
              Metric: <strong className="text-slate-200">{game.categoryConfig?.stepMetricLabel || "Guesses"}</strong>
            </span>
          )}
          {catType === "grouping_deduction" && (
            <span className="bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
              {game.categoryConfig?.totalGroups || 4} Groups / {game.categoryConfig?.maxMistakes || 4} Mistakes
            </span>
          )}
          {catType === "high_score_timed" && (
            <span className="bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
              Metric: <strong className="text-slate-200">{game.categoryConfig?.scoreType || "Points"}</strong>
            </span>
          )}
          {catType === "competitive_match" && (
            <span className="bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px] text-rose-300">
              PvP Match
            </span>
          )}
        </div>
      </div>

      {/* Action Footers */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2.5">
        <a
          href={game.gameUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${
            isDaily ? "flex-1" : "w-full"
          } inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl ${
            isDaily
              ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
          } text-xs font-black shadow-lg active:scale-95 transition-all`}
        >
          <Play className={`w-3.5 h-3.5 ${isDaily ? "fill-slate-950" : "fill-white"}`} />
          <span>Play</span>
        </a>

        {isDaily && (
          <Button
            id={`browse-log-score-btn-${game.id}`}
            variant="outline"
            size="sm"
            onClick={() => onLogScore(game)}
            className="flex-1 text-xs font-bold rounded-xl border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Log Score</span>
          </Button>
        )}
      </div>
    </div>
  );
};
