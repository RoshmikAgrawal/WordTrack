import React, { useState } from "react";
import { DailyTrackerItem, Game, GameLog, CategoryItem } from "../../types";
import { Check, X, Edit3, ExternalLink, MessageSquareQuote, CheckCircle2, Zap, Trash2, AlertTriangle } from "lucide-react";
import { getCategoryBadgeStyle, getCategoryTypeLabel, formatGameLogBadge } from "../../lib/utils";
import { Button } from "../ui";

interface CompletedGamesListProps {
  items: DailyTrackerItem[];
  categories?: CategoryItem[];
  onEditScore: (game: Game, log: GameLog) => void;
  onDeleteScore?: (game: Game, log: GameLog) => void;
}

export const CompletedGamesList: React.FC<CompletedGamesListProps> = ({
  items,
  categories,
  onEditScore,
  onDeleteScore,
}) => {
  const [gameToDelete, setGameToDelete] = useState<{ game: Game; log: GameLog } | null>(null);

  if (items.length === 0) return null;

  const handleConfirmDelete = () => {
    if (gameToDelete && onDeleteScore) {
      onDeleteScore(gameToDelete.game, gameToDelete.log);
    }
    setGameToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Completed Today ({items.length})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(({ game, log }) => {
          if (!log) return null;
          const isSolved = log.status === "solved";
          const catType = game.categoryType || "classic_single";
          const catStyle = getCategoryBadgeStyle(catType, categories);
          const catLabel = getCategoryTypeLabel(catType, categories, game.category);
          const badgeText = formatGameLogBadge(log);

          return (
            <div
              key={game.id}
              id={`completed-game-${game.id}`}
              className="group relative rounded-3xl bg-slate-900/35 border border-slate-800/80 p-6 backdrop-blur-xl flex flex-col justify-between transition-all hover:bg-slate-900/50 hover:border-slate-700/60 shadow-xl shadow-black/20"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {game.iconUrl ? (
                        <img
                          src={game.iconUrl}
                          alt={game.title}
                          className="w-full h-full object-cover rounded-xl opacity-80"
                        />
                      ) : (
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {game.title.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{game.title}</span>
                      </h3>
                      <span
                        className={`inline-block mt-0.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                      >
                        {catLabel}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Category Result Badge */}
                  {isSolved ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono shadow-sm shadow-emerald-950/40">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{badgeText}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{badgeText}</span>
                    </div>
                  )}
                </div>

                {/* Notes & Pasted Grid */}
                {log.notes && (
                  <div className="my-3.5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto shadow-inner">
                    {log.notes}
                  </div>
                )}
              </div>

              {/* Edit / Delete / Revisit Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <a
                  href={game.gameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Revisit</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    id={`delete-score-btn-${game.id}`}
                    onClick={() => setGameToDelete({ game, log })}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-xs font-bold border border-slate-700/50 hover:border-rose-500/30 transition-all cursor-pointer"
                    title="Delete today's log and move game to remaining"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <button
                    id={`edit-score-btn-${game.id}`}
                    onClick={() => onEditScore(game, log)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-emerald-400" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {gameToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Unlog Game Score?</h3>
                <p className="text-xs text-slate-400">Move game back to Remaining</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete today's score for <strong className="text-white">{gameToDelete.game.title}</strong>? This will remove the record from today's journal and move <span className="text-emerald-400 font-semibold">{gameToDelete.game.title}</span> back to your <strong>Remaining Daily Games</strong> list.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGameToDelete(null)}
                className="text-xs font-semibold border-slate-700 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

