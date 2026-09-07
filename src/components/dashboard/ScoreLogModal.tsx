import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui";
import { Game, GameLog, GameCategoryType, CategoryItem } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { saveGameLog } from "../../services/logs.service";
import { parseWordGameShareText, getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";
import {
  Check,
  X,
  Sparkles,
  ExternalLink,
  Lock,
  ArrowRight,
  AlertCircle,
  Zap,
  Award,
  Layers,
  HelpCircle,
} from "lucide-react";

export interface ScoreLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  playedDate: string;
  existingLog?: GameLog;
  categories?: CategoryItem[];
  onLogSaved: (log: GameLog) => void;
}

export const ScoreLogModal: React.FC<ScoreLogModalProps> = ({
  isOpen,
  onClose,
  game,
  playedDate,
  existingLog,
  categories,
  onLogSaved,
}) => {
  const { user, openAuthModal } = useAuth();

  // Core Result
  const [status, setStatus] = useState<"solved" | "failed">("solved");

  // Dynamic Category Metrics
  const [attemptsTaken, setAttemptsTaken] = useState<number>(3);
  const [boardsSolved, setBoardsSolved] = useState<number>(4);
  const [totalBoards, setTotalBoards] = useState<number>(4);
  const [stepsCount, setStepsCount] = useState<number>(25);
  const [mistakesMade, setMistakesMade] = useState<number>(0);
  const [groupsCleared, setGroupsCleared] = useState<number>(4);
  const [scoreAchieved, setScoreAchieved] = useState<number>(500);

  // Notes & Clipboard
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pasteDetectedFeedback, setPasteDetectedFeedback] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categoryType: GameCategoryType = game?.categoryType || "classic_single";
  const config = game?.categoryConfig || {};
  const maxAttempts = config.maxAttempts || game?.maxAttempts || 6;
  const cfgTotalBoards = config.totalBoards || 4;
  const cfgTotalGroups = config.totalGroups || 4;
  const cfgMaxMistakes = config.maxMistakes || 4;
  const stepMetricLabel = config.stepMetricLabel || "Guesses";
  const scoreType = config.scoreType || "Points";

  // Initialize or reset form state when game or existingLog changes
  useEffect(() => {
    if (existingLog) {
      setStatus(existingLog.status);
      setAttemptsTaken(existingLog.attemptsTaken || existingLog.attempts || 3);
      setBoardsSolved(existingLog.boardsSolved ?? (existingLog.status === "solved" ? cfgTotalBoards : 0));
      setTotalBoards(existingLog.totalBoards || cfgTotalBoards);
      setStepsCount(existingLog.stepsCount || 20);
      setMistakesMade(existingLog.mistakesMade ?? 0);
      setGroupsCleared(existingLog.groupsCleared ?? (existingLog.status === "solved" ? cfgTotalGroups : 0));
      setScoreAchieved(existingLog.scoreAchieved ?? 500);
      setNotes(existingLog.notes || "");
    } else {
      setStatus("solved");
      setAttemptsTaken(game ? Math.min(3, maxAttempts) : 3);
      setBoardsSolved(cfgTotalBoards);
      setTotalBoards(cfgTotalBoards);
      setStepsCount(20);
      setMistakesMade(0);
      setGroupsCleared(cfgTotalGroups);
      setScoreAchieved(500);
      setNotes("");
    }
    setPasteDetectedFeedback(null);
    setSubmitError(null);
  }, [game, existingLog, isOpen]);

  if (!game) return null;

  // Handle smart paste into notes
  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (!existingLog && val.length > 3) {
      const parsed = parseWordGameShareText(val);
      if (categoryType === "unlimited_steps") {
        if (parsed.detectedSteps) {
          setStepsCount(parsed.detectedSteps);
          setPasteDetectedFeedback(`Auto-detected: ${parsed.detectedSteps} ${stepMetricLabel.toLowerCase()}`);
        }
      } else if (parsed.detectedStatus) {
        setStatus(parsed.detectedStatus);
        if (parsed.detectedAttempts && parsed.detectedAttempts <= maxAttempts) {
          setAttemptsTaken(parsed.detectedAttempts);
          setPasteDetectedFeedback(
            `Auto-detected: ${
              parsed.detectedStatus === "solved"
                ? `Solved in ${parsed.detectedAttempts} tries`
                : "Failed"
            }`
          );
        } else if (parsed.detectedStatus === "failed") {
          setPasteDetectedFeedback("Auto-detected: Failed / Unsolved");
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!user) {
      openAuthModal(
        "login",
        `Please sign in or create an account to record your score for "${game.title}" to your permanent diary.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const isNonBinaryCategory = categoryType === "unlimited_steps" || categoryType === "high_score_timed";

      const saved = await saveGameLog({
        userId: user.uid,
        gameId: game.id,
        gameTitle: game.title,
        playedDate,
        categoryType,
        status: isNonBinaryCategory ? "solved" : status,

        // Specific metrics
        attemptsTaken: (categoryType === "unlimited_steps" || status === "solved") ? attemptsTaken : null,
        maxAttempts,
        boardsSolved: categoryType === "multi_board" ? (status === "solved" ? totalBoards : boardsSolved) : null,
        totalBoards: categoryType === "multi_board" ? totalBoards : null,
        stepsCount: categoryType === "unlimited_steps" ? stepsCount : null,
        mistakesMade: categoryType === "grouping_deduction" ? mistakesMade : null,
        groupsCleared: categoryType === "grouping_deduction" ? (status === "solved" ? cfgTotalGroups : groupsCleared) : null,
        totalGroups: categoryType === "grouping_deduction" ? cfgTotalGroups : null,
        scoreAchieved: categoryType === "high_score_timed" ? scoreAchieved : null,
        scoreType: categoryType === "high_score_timed" ? scoreType : null,

        notes,
      });

      onLogSaved(saved);
      onClose();
    } catch (error: any) {
      console.error("Failed to save game log:", error);
      setSubmitError(error?.message || "Failed to sync score to your cloud journal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const catStyle = getCategoryBadgeStyle(categoryType, categories);
  const catLabel = getCategoryTypeLabel(categoryType, categories, game?.category);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-1">
            {game.iconUrl ? (
              <img
                src={game.iconUrl}
                alt={game.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="font-bold text-emerald-400 font-mono">{game.title.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                <span>{game.title}</span>
                <a
                  href={game.gameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5"
                  title="Open Game in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
              >
                {catLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Daily Challenge for <span className="text-slate-200 font-semibold">{playedDate}</span>
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
        {/* Guest Warning */}
        {!user && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300">Sign in to save scores</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Sign in with Google or Email to record this score in your permanent journal and maintain your streak.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                openAuthModal(
                  "login",
                  `Sign in to save your score for "${game.title}" to your permanent diary and maintain daily streaks.`
                )
              }
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {submitError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 1. Result Outcome Toggle (Not shown for unlimited steps or high score games) */}
        {categoryType !== "unlimited_steps" && categoryType !== "high_score_timed" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Game Result
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="outcome-solved-btn"
                type="button"
                onClick={() => setStatus("solved")}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                  status === "solved"
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    status === "solved" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>Solved</span>
              </button>

              <button
                id="outcome-failed-btn"
                type="button"
                onClick={() => {
                  setStatus("failed");
                  if (categoryType === "multi_board" && boardsSolved >= totalBoards) {
                    setBoardsSolved(Math.max(0, totalBoards - 1));
                  }
                }}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                  status === "failed"
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    status === "failed" ? "bg-rose-500 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>Unsolved / Failed</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Dynamic Category Specific Metric Inputs */}

        {/* --- DYNAMIC CASE A: Classic Single Board --- */}
        {categoryType === "classic_single" && status === "solved" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Number of Attempts (Guesses)
              </label>
              <span className="text-xs font-bold text-emerald-400">
                {attemptsTaken} of {maxAttempts}{" "}
                {attemptsTaken === 1 ? "Guess (Genius!)" : attemptsTaken === maxAttempts ? "Last Try!" : "Tries"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {Array.from({ length: maxAttempts }, (_, i) => i + 1).map((num) => {
                const isSelected = attemptsTaken === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAttemptsTaken(num)}
                    className={`h-11 min-w-[42px] px-3 flex-1 flex flex-col items-center justify-center rounded-xl border font-mono text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-900/50 scale-105"
                        : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{num}</span>
                    <span className="text-[10px] opacity-70 font-sans font-normal">/{maxAttempts}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- DYNAMIC CASE B: Multi-Board Grid --- */}
        {categoryType === "multi_board" && (
          <div className="space-y-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            {status === "solved" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Attempts Used to Clear All {totalBoards} Boards
                  </label>
                  <span className="text-xs font-bold text-emerald-400">
                    {attemptsTaken} / {maxAttempts} tries
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={totalBoards}
                    max={maxAttempts}
                    value={attemptsTaken}
                    onChange={(e) => setAttemptsTaken(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono font-bold text-white bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                    {attemptsTaken}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Boards Successfully Cleared (out of {totalBoards})
                  </label>
                  <span className="text-xs font-bold text-rose-400">
                    {boardsSolved} / {totalBoards} boards
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Array.from({ length: totalBoards }, (_, i) => i).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBoardsSolved(num)}
                      className={`h-11 min-w-[42px] px-3 flex-1 flex items-center justify-center rounded-xl border text-sm font-mono font-bold transition-all cursor-pointer ${
                        boardsSolved === num
                          ? "bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-950/50 scale-105"
                          : "bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- DYNAMIC CASE C: Unlimited Steps / Ladder --- */}
        {categoryType === "unlimited_steps" && (
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Total {stepMetricLabel} to Reach Solution
              </label>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {stepsCount} {stepsCount === 1 ? stepMetricLabel.replace(/s$/i, "") : stepMetricLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Enter the total count of {stepMetricLabel.toLowerCase()} taken to find the answer.
            </p>
            <div className="flex items-center gap-3">
              <input
                id="steps-count-input"
                type="number"
                min={1}
                max={9999}
                value={stepsCount}
                onChange={(e) => setStepsCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-3 text-base text-white font-mono font-bold outline-none"
                placeholder={`e.g. 24 ${stepMetricLabel.toLowerCase()}`}
                required
              />
              <span className="text-xs text-slate-300 shrink-0 font-semibold px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                {stepMetricLabel}
              </span>
            </div>
          </div>
        )}

        {/* --- DYNAMIC CASE D: Grouping & Deduction --- */}
        {categoryType === "grouping_deduction" && (
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            {status === "solved" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Mistakes Made
                  </label>
                  <span className="text-xs font-bold text-emerald-400">
                    {mistakesMade === 0 ? "Perfect 0 Mistakes! 🎯" : `${mistakesMade} mistakes`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((mistakeNum) => (
                    <button
                      key={mistakeNum}
                      type="button"
                      onClick={() => setMistakesMade(mistakeNum)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        mistakesMade === mistakeNum
                          ? "bg-purple-600 border-purple-400 text-white shadow-md"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {mistakeNum === 0 ? "0 (Perfect)" : `${mistakeNum} Mistake${mistakeNum === 1 ? "" : "s"}`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Groups Cleared (out of {cfgTotalGroups})
                  </label>
                  <span className="text-xs font-bold text-rose-400">
                    {groupsCleared} / {cfgTotalGroups} groups
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {Array.from({ length: cfgTotalGroups }, (_, i) => i).map((grpNum) => (
                    <button
                      key={grpNum}
                      type="button"
                      onClick={() => setGroupsCleared(grpNum)}
                      className={`h-11 flex items-center justify-center rounded-xl border text-sm font-mono font-bold transition-all cursor-pointer ${
                        groupsCleared === grpNum
                          ? "bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-950/50 scale-105"
                          : "bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {grpNum}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- DYNAMIC CASE E: High Score / Timed --- */}
        {categoryType === "high_score_timed" && (
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <label
              htmlFor="high-score-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Final Score Achieved
            </label>
            <div className="flex items-center gap-3">
              <input
                id="high-score-input"
                type="number"
                min={0}
                max={1000000}
                value={scoreAchieved}
                onChange={(e) => setScoreAchieved(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold outline-none"
                placeholder="e.g. 1450"
                required
              />
              <span className="text-xs text-slate-400 shrink-0 font-medium">{scoreType}</span>
            </div>
          </div>
        )}

        {/* Universal Notes Field & Paste Share Text Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Journal Notes or Paste Score Share Text
            </label>
            <span className="text-[11px] text-slate-500">Optional</span>
          </div>

          <textarea
            id="score-notes-textarea"
            rows={3}
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Paste your Wordle/Connections share text or note down clues, words, and reflections..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none resize-none font-mono"
          />

          {pasteDetectedFeedback && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{pasteDetectedFeedback}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            id="save-score-submit-btn"
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="px-6"
          >
            {existingLog ? "Update Score" : "Log Score"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
