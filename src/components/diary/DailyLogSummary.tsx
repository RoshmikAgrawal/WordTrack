import React, { useState } from "react";
import { Game, GameLog, CategoryItem } from "../../types";
import { formatDisplayDate, formatGameLogBadge, formatGameLogDetails, getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";
import { Button } from "../ui";
import {
  Check,
  X,
  Edit3,
  Share2,
  Trophy,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
} from "lucide-react";

interface DailyLogSummaryProps {
  date: string;
  logs: GameLog[];
  allGames: Game[];
  categories?: CategoryItem[];
  onLogNewScore?: () => void;
  onEditLog: (game: Game, log: GameLog) => void;
  onDeleteLogs?: (gameIds: string[]) => Promise<void> | void;
}

export const DailyLogSummary: React.FC<DailyLogSummaryProps> = ({
  date,
  logs,
  allGames,
  categories,
  onLogNewScore,
  onEditLog,
  onDeleteLogs,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [singleItemToDelete, setSingleItemToDelete] = useState<GameLog | null>(null);

  const solvedCount = logs.filter((l) => l.status === "solved").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;

  const handleShareSummary = async () => {
    let summary = `WordTrack Daily Journal — ${formatDisplayDate(date)}\n`;
    summary += `Played: ${logs.length} | Solved: ${solvedCount}/${logs.length}\n\n`;

    logs.forEach((log) => {
      const badge = formatGameLogBadge(log);
      const details = formatGameLogDetails(log);
      if (log.status === "solved") {
        summary += `🟩 ${log.gameTitle}: Solved (${badge})\n`;
      } else {
        summary += `🟥 ${log.gameTitle}: Failed (${badge})\n`;
      }
      if (details) {
        summary += `   ${details}\n`;
      }
      if (log.notes) {
        summary += `${log.notes}\n`;
      }
      summary += "\n";
    });

    try {
      await navigator.clipboard.writeText(summary.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  const getGameById = (gameId: string): Game => {
    const found = allGames.find((g) => g.id === gameId);
    if (found) return found;
    return {
      id: gameId,
      title: gameId,
      description: "",
      gameUrl: "#",
      category: "Classic Single-Board",
      categoryType: "classic_single",
      categoryConfig: { maxAttempts: 6 },
      isDaily: true,
      iconUrl: "",
      maxAttempts: 6,
      isActive: true,
    };
  };

  const toggleSelectAll = () => {
    if (selectedGameIds.length === logs.length) {
      setSelectedGameIds([]);
    } else {
      setSelectedGameIds(logs.map((l) => l.gameId));
    }
  };

  const toggleSelectGame = (gameId: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]
    );
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteLogs) return;

    if (singleItemToDelete) {
      await onDeleteLogs([singleItemToDelete.gameId]);
      setSingleItemToDelete(null);
    } else if (selectedGameIds.length > 0) {
      await onDeleteLogs(selectedGameIds);
      setSelectedGameIds([]);
      setIsEditMode(false);
      setShowConfirmModal(false);
    }
  };

  const selectedLogObjects = logs.filter((l) => selectedGameIds.includes(l.gameId));

  return (
    <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-6 sm:p-7 backdrop-blur-xl shadow-xl shadow-black/30 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatDisplayDate(date)}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {logs.length === 0
              ? "No game records found for this date."
              : `${logs.length} daily game${logs.length === 1 ? "" : "s"} logged • ${solvedCount} Solved, ${failedCount} Failed`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {logs.length > 0 && !isEditMode && (
            <Button
              id="share-diary-summary-btn"
              variant="outline"
              size="sm"
              onClick={handleShareSummary}
              className="text-xs font-bold rounded-xl border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Recap</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share Day Recap</span>
                </>
              )}
            </Button>
          )}

          {logs.length > 0 && (
            <Button
              id="diary-log-score-btn"
              variant={isEditMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                if (isEditMode) {
                  setIsEditMode(false);
                  setSelectedGameIds([]);
                } else {
                  setIsEditMode(true);
                  setSelectedGameIds([]);
                }
              }}
              className={`text-xs font-bold rounded-xl transition-all ${
                isEditMode
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                  : "border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200"
              }`}
            >
              {isEditMode ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Edit</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Select Edit Actions Toolbar */}
      {isEditMode && logs.length > 0 && (
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-inner">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {selectedGameIds.length === logs.length ? (
                <>
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Select All ({logs.length})</span>
                </>
              )}
            </button>
            <span className="text-xs font-semibold text-slate-400">
              {selectedGameIds.length} of {logs.length} selected
            </span>
          </div>

          <Button
            variant="danger"
            size="sm"
            disabled={selectedGameIds.length === 0}
            onClick={() => setShowConfirmModal(true)}
            className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-950/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedGameIds.length})</span>
          </Button>
        </div>
      )}

      {/* Scoped Scrollable Logs Container */}
      {logs.length > 0 ? (
        <div
          id="daily-logs-scroll-container"
          className="space-y-3.5 max-h-[500px] sm:max-h-[540px] overflow-y-auto overscroll-contain pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {logs.map((log) => {
            const isSolved = log.status === "solved";
            const game = getGameById(log.gameId);
            const catType = log.categoryType || game.categoryType || "classic_single";
            const catStyle = getCategoryBadgeStyle(catType, categories);
            const catLabel = getCategoryTypeLabel(catType, categories, game.category);
            const badgeText = formatGameLogBadge(log);
            const detailsText = formatGameLogDetails(log);
            const isSelected = selectedGameIds.includes(log.gameId);

            return (
              <div
                key={log.id}
                onClick={() => {
                  if (isEditMode) {
                    toggleSelectGame(log.gameId);
                  }
                }}
                className={`rounded-2xl border p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
                  isEditMode ? "cursor-pointer select-none" : ""
                } ${
                  isSelected
                    ? "bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/30"
                    : "bg-slate-950/60 border-slate-800/90 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Edit mode checkbox indicator */}
                  {isEditMode && (
                    <div className="pt-2 shrink-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-rose-600 border-rose-500 text-white"
                            : "bg-slate-900 border-slate-700 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      isSolved
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950/40"
                        : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                    }`}
                  >
                    {isSolved ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="text-sm font-bold text-white">{log.gameTitle}</h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                      >
                        {catLabel}
                      </span>

                      {isSolved ? (
                        <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          {badgeText}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-400 px-2.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          {badgeText}
                        </span>
                      )}
                    </div>

                    {detailsText && (
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        {detailsText}
                      </p>
                    )}

                    {log.notes && (
                      <div className="text-xs text-slate-200 font-mono mt-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/90 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto shadow-inner">
                        {log.notes}
                      </div>
                    )}
                  </div>
                </div>

                {!isEditMode && (
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => setSingleItemToDelete(log)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                      title="Delete / Unlog entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditLog(game, log)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                      title="Edit Score"
                    >
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800/80 p-10 text-center space-y-3.5">
          <p className="text-sm text-slate-400">
            No daily word game entries recorded on this day.
          </p>
        </div>
      )}

      {/* Multi-Select Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Selected Game Logs?</h3>
                <p className="text-xs text-slate-400">Unlog {selectedGameIds.length} puzzle entries</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{selectedGameIds.length} game log{selectedGameIds.length === 1 ? "" : "s"}</strong> for <strong className="text-white">{formatDisplayDate(date)}</strong>? This will unlog these scores from your daily journal:
            </p>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 max-h-36 overflow-y-auto space-y-1.5">
              {selectedLogObjects.map((log) => (
                <div key={log.id} className="text-xs text-slate-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span className="font-semibold text-white">{log.gameTitle}</span>
                  <span className="text-[10px] text-slate-500">({formatGameLogBadge(log)})</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
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
                <span>Confirm & Delete ({selectedGameIds.length})</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single Item Delete Confirmation Modal */}
      {singleItemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Unlog Game Score?</h3>
                <p className="text-xs text-slate-400">Delete journal entry</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete the score log for <strong className="text-white">{singleItemToDelete.gameTitle}</strong> on <strong className="text-white">{formatDisplayDate(date)}</strong>? This will remove the record from your daily diary.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSingleItemToDelete(null)}
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

