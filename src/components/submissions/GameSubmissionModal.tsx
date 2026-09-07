import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GameCategoryType,
  CategoryConfig,
  CategoryItem,
  CATEGORY_DEFINITIONS,
} from "../../types";
import { Button, Input } from "../ui";
import { useAuth } from "../../context/AuthContext";
import { createGameSubmission } from "../../services/submissions.service";
import {
  Zap,
  Gamepad2,
  Check,
  Send,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";

interface GameSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: CategoryItem[];
  pendingCount: number;
  onSuccess?: () => void;
}

export const GameSubmissionModal: React.FC<GameSubmissionModalProps> = ({
  isOpen,
  onClose,
  categories = [],
  pendingCount,
  onSuccess,
}) => {
  const { user, userProfile } = useAuth();

  // Wizard Step (1: Classification, 2: Category, 3: Rules Config, 4: Metadata & Review)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);

  // Step 1: Classification
  const [isDaily, setIsDaily] = useState<boolean>(true);

  // Step 2: Category
  const [categoryType, setCategoryType] = useState<GameCategoryType>("classic_single");

  // Step 3: Dynamic Rules Config
  const [maxAttempts, setMaxAttempts] = useState<number>(6);
  const [totalBoards, setTotalBoards] = useState<number>(4);
  const [totalGroups, setTotalGroups] = useState<number>(4);
  const [maxMistakes, setMaxMistakes] = useState<number>(4);
  const [stepMetricLabel, setStepMetricLabel] = useState<string>("Guesses");
  const [scoreType, setScoreType] = useState<string>("Points");

  // Step 4: Metadata
  const [title, setTitle] = useState("");
  const [gameUrl, setGameUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Helper to extract effective category details merging custom edited category state with base definitions
  const getEffectiveCategoryData = (catKey: GameCategoryType | string) => {
    const def = CATEGORY_DEFINITIONS[catKey as GameCategoryType];
    const custom = categories?.find(
      (c) =>
        c.id === catKey ||
        c.id === catKey.replace(/_/g, "-") ||
        c.id === catKey.replace(/-/g, "_") ||
        c.name.toLowerCase() === def?.label?.toLowerCase()
    );

    return {
      id: (custom?.id || catKey) as GameCategoryType,
      label: custom?.name?.trim() || def?.label || catKey,
      description: custom?.description?.trim() || def?.description || "",
      colorKey: custom?.colorKey || def?.colorKey || "emerald",
      defaultDaily: custom?.defaultDaily !== undefined ? custom.defaultDaily : (def?.defaultDaily ?? true),
      loggable: custom?.loggable !== undefined ? custom.loggable : (def?.loggable ?? true),
      defaultConfig: {
        ...(def?.defaultConfig || {}),
        ...(custom?.defaultConfig || {}),
      },
    };
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setMaxStepReached(1);
      const initialCat: GameCategoryType =
        (categories && categories[0]?.id as GameCategoryType) || "classic_single";
      const effectiveData = getEffectiveCategoryData(initialCat);

      setIsDaily(effectiveData.defaultDaily);
      setCategoryType(initialCat);
      setMaxAttempts(effectiveData.defaultConfig.maxAttempts || 6);
      setTotalBoards(effectiveData.defaultConfig.totalBoards || 4);
      setTotalGroups(effectiveData.defaultConfig.totalGroups || 4);
      setMaxMistakes(effectiveData.defaultConfig.maxMistakes || 4);
      setStepMetricLabel(effectiveData.defaultConfig.stepMetricLabel || "Guesses");
      setScoreType(effectiveData.defaultConfig.scoreType || "Points");

      setTitle("");
      setGameUrl("");
      setIconUrl("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

  const handleCategorySelect = (newType: GameCategoryType) => {
    setCategoryType(newType);
    const catData = getEffectiveCategoryData(newType);
    setIsDaily(catData.defaultDaily);

    if (newType === "classic_single") {
      setMaxAttempts(catData.defaultConfig.maxAttempts || 6);
    } else if (newType === "multi_board") {
      setTotalBoards(catData.defaultConfig.totalBoards || 4);
      setMaxAttempts(catData.defaultConfig.maxAttempts || 9);
    } else if (newType === "unlimited_steps") {
      setStepMetricLabel(catData.defaultConfig.stepMetricLabel || "Guesses");
    } else if (newType === "grouping_deduction") {
      setTotalGroups(catData.defaultConfig.totalGroups || 4);
      setMaxMistakes(catData.defaultConfig.maxMistakes || 4);
    } else if (newType === "high_score_timed") {
      setScoreType(catData.defaultConfig.scoreType || "Points");
    }
  };

  // Strict Validation Function
  const isStepValid = (step: number): boolean => {
    if (step === 1) {
      // Step 1 (Classification): Always valid (isDaily boolean is pre-selected)
      return true;
    }
    if (step === 2) {
      // Step 2 (Category): Valid if categoryType is selected
      return Boolean(categoryType);
    }
    if (step === 3) {
      // Step 3 (Rules Config): Validates based on active category
      if (categoryType === "classic_single") {
        return Number(maxAttempts) >= 1 && Number(maxAttempts) <= 30;
      }
      if (categoryType === "multi_board") {
        return Number(totalBoards) >= 2 && Number(maxAttempts) >= 1;
      }
      if (categoryType === "unlimited_steps") {
        return stepMetricLabel.trim().length > 0 && stepMetricLabel.trim().length <= 24;
      }
      if (categoryType === "grouping_deduction") {
        return Number(totalGroups) >= 2 && Number(maxMistakes) >= 1;
      }
      if (categoryType === "high_score_timed") {
        return scoreType.trim().length > 0;
      }
      if (categoryType === "competitive_match") {
        return true;
      }
      return true;
    }
    if (step === 4) {
      // Step 4 (Metadata & Review): Valid if title >= 2, gameUrl starts with http, description >= 10
      return (
        title.trim().length >= 2 &&
        gameUrl.trim().startsWith("http") &&
        description.trim().length >= 10
      );
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setError("You must be signed in to submit a game.");
      return;
    }

    if (pendingCount >= 3) {
      setError("You already have 3 pending submissions. Please wait for an administrator to review them.");
      return;
    }

    if (!isStepValid(4)) {
      if (title.trim().length < 2) {
        setError("Game Title must be at least 2 characters.");
      } else if (!gameUrl.trim().startsWith("http")) {
        setError("Game URL must start with http:// or https://");
      } else if (description.trim().length < 10) {
        setError("Please provide a description of at least 10 characters.");
      } else {
        setError("Please fill in all required fields.");
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Build structured CategoryConfig
      const categoryConfig: CategoryConfig = {};
      if (categoryType === "classic_single") {
        categoryConfig.maxAttempts = Number(maxAttempts) || 6;
      } else if (categoryType === "multi_board") {
        categoryConfig.totalBoards = Number(totalBoards) || 4;
        categoryConfig.maxAttempts = Number(maxAttempts) || 9;
      } else if (categoryType === "unlimited_steps") {
        categoryConfig.stepMetricLabel = stepMetricLabel.trim() || "Guesses";
      } else if (categoryType === "grouping_deduction") {
        categoryConfig.totalGroups = Number(totalGroups) || 4;
        categoryConfig.maxMistakes = Number(maxMistakes) || 4;
      } else if (categoryType === "high_score_timed") {
        categoryConfig.scoreType = scoreType.trim() || "Points";
      }

      await createGameSubmission({
        userId: user.uid,
        userDisplayName: userProfile?.displayName || user.displayName || user.email?.split("@")[0] || "Player",
        userEmail: user.email || "",
        title: title.trim(),
        description: description.trim(),
        gameUrl: gameUrl.trim(),
        iconUrl: iconUrl.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
        isDaily,
        categoryType,
        categoryConfig,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit game. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="game-submission-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Outer Dialog Box */}
          <motion.div
            id="game-submission-modal"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden transition-all"
          >
            {/* Fixed Header (shrink-0) */}
            <div className="shrink-0 px-5 sm:px-7 pt-4 sm:pt-5 pb-2.5 border-b border-slate-800/80 bg-slate-900">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                        Submit New Word Game
                      </h3>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                        Step {currentStep} of 4
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  id="modal-close-button"
                  onClick={onClose}
                  className="shrink-0 rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Expanding Multi-Step Header Tabs */}
              <div className="flex items-center gap-1.5 w-full pt-1 pb-2">
                {[
                  { step: 1, label: "Classification" },
                  { step: 2, label: "Category" },
                  { step: 3, label: "Rules Config" },
                  { step: 4, label: "Metadata & Review" },
                ].map(({ step, label }) => {
                  const isActive = currentStep === step;
                  const isCompleted = step < currentStep && isStepValid(step);
                  const canNavigate =
                    step <= maxStepReached &&
                    (step < currentStep || isStepValid(currentStep));

                  return (
                    <button
                      key={step}
                      type="button"
                      disabled={!canNavigate}
                      onClick={() => {
                        if (canNavigate) {
                          setError(null);
                          setCurrentStep(step);
                        }
                      }}
                      className={`h-8 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                        isActive
                          ? "flex-1 px-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 font-bold text-xs min-w-0 shadow-sm"
                          : isCompleted
                          ? "w-8 shrink-0 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-slate-800"
                          : "w-8 shrink-0 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed opacity-50"
                      }`}
                    >
                      <span className="shrink-0">{step}</span>
                      {isActive && (
                        <span className="truncate ml-1.5 text-xs tracking-tight">
                          {label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Body (flex-1 overflow-y-auto) */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 space-y-5"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* Quota limit warning */}
              {pendingCount >= 3 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    You have reached the maximum quota of 3 pending submissions. You cannot submit new games until your pending submissions are reviewed.
                  </span>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ================= STEP 1: Classification ================= */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-0.5">
                      Step 1: Choose Game Playstyle & Tracking Mode
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Is this game a once-a-day challenge with a synchronized puzzle, or an open casual/practice game?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Daily Challenge Card */}
                    <button
                      type="button"
                      onClick={() => setIsDaily(true)}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[160px] ${
                        isDaily
                          ? "bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/40"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-xl ${
                                isDaily ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              <Zap className="w-4 h-4" />
                            </div>
                            <span className={`text-sm sm:text-base font-bold ${isDaily ? "text-white" : "text-slate-300"}`}>
                              Daily Challenge
                            </span>
                          </div>
                          {isDaily && <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Games with a synchronized daily puzzle (e.g. Wordle, Quordle, Connections). Players record daily scores and track streaks.
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                        <span>Tracks daily streaks & stats</span>
                      </div>
                    </button>

                    {/* Casual / Practice Card */}
                    <button
                      type="button"
                      onClick={() => setIsDaily(false)}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[160px] ${
                        !isDaily
                          ? "bg-indigo-500/15 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/40"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-xl ${
                                !isDaily ? "bg-indigo-500 text-slate-950" : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              <Gamepad2 className="w-4 h-4" />
                            </div>
                            <span className={`text-sm sm:text-base font-bold ${!isDaily ? "text-white" : "text-slate-300"}`}>
                              Casual / Practice
                            </span>
                          </div>
                          {!isDaily && <Check className="w-5 h-5 text-indigo-400 stroke-[3]" />}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Open-ended practice puzzles, unlimited generators, multiplayer battles, or arcade word challenges.
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400">
                        <span>Cataloged in practice library</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: Category ================= */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-0.5">
                      Step 2: Select Gameplay Category
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Choose the gameplay mechanic that matches how the puzzle functions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {((categories && categories.length > 0)
                      ? categories.map((c) => c.id as GameCategoryType)
                      : (Object.keys(CATEGORY_DEFINITIONS) as GameCategoryType[])
                    ).map((catKey) => {
                      const catData = getEffectiveCategoryData(catKey);
                      const isSelected = categoryType === catKey;
                      const catBadge = getCategoryBadgeStyle(catKey, categories);

                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => handleCategorySelect(catKey)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? `${catBadge.bg} ${catBadge.border} ring-1 ${catBadge.ring} shadow-md`
                              : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${catBadge.dot}`} />
                              <span
                                className={`text-xs sm:text-sm font-bold truncate ${
                                  isSelected ? "text-white" : "text-slate-200"
                                }`}
                              >
                                {catData.label}
                              </span>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {catData.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= STEP 3: Rules & Configuration ================= */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-0.5">
                      Step 3: Configure Category Rules ({getCategoryTypeLabel(categoryType, categories)})
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Set up attempt limits, boards, and score units according to the game's actual rules.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    {/* Classic Single */}
                    {categoryType === "classic_single" && (
                      <div className="space-y-2 max-w-md">
                        <Input
                          id="submit-max-attempts"
                          label="Max Guesses / Attempts Allowed (1-30) *"
                          type="number"
                          min={1}
                          max={30}
                          value={maxAttempts}
                          onChange={(e) => setMaxAttempts(Number(e.target.value))}
                          placeholder="e.g. 6 (Wordle), 8 (Word500)"
                          required
                        />
                        <p className="text-[11px] text-slate-400">
                          Players record guesses taken from 1 to {maxAttempts} or mark as failed.
                        </p>
                      </div>
                    )}

                    {/* Multi Board */}
                    {categoryType === "multi_board" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          id="submit-total-boards"
                          label="Total Boards / Grids (≥2) *"
                          type="number"
                          min={2}
                          max={32}
                          value={totalBoards}
                          onChange={(e) => setTotalBoards(Number(e.target.value))}
                          placeholder="e.g. 2 (Dordle), 4 (Quordle)"
                          required
                        />
                        <Input
                          id="submit-multi-max-attempts"
                          label="Total Attempts (≥1) *"
                          type="number"
                          min={1}
                          max={40}
                          value={maxAttempts}
                          onChange={(e) => setMaxAttempts(Number(e.target.value))}
                          placeholder="e.g. 9 (Quordle)"
                          required
                        />
                        <p className="text-[11px] text-slate-400 sm:col-span-2">
                          Logs record both total boards cleared (0-{totalBoards}) and total attempts used (1-{maxAttempts}).
                        </p>
                      </div>
                    )}

                    {/* Unlimited Steps */}
                    {categoryType === "unlimited_steps" && (
                      <div className="space-y-2 max-w-md">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label
                              htmlFor="submit-step-metric"
                              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                            >
                              Step Metric Label *
                            </label>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {stepMetricLabel.length} / 24 chars
                            </span>
                          </div>
                          <input
                            id="submit-step-metric"
                            type="text"
                            maxLength={24}
                            value={stepMetricLabel}
                            onChange={(e) => setStepMetricLabel(e.target.value)}
                            placeholder="e.g. Guesses, Steps, Swaps, Relations..."
                            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                            required
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Defines what the counter represents (e.g. "Metric: {stepMetricLabel.trim() || 'Guesses'}"). Max 24 characters.
                        </p>
                      </div>
                    )}

                    {/* Grouping & Deduction */}
                    {categoryType === "grouping_deduction" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          id="submit-total-groups"
                          label="Total Groups to Find (≥2) *"
                          type="number"
                          min={2}
                          max={8}
                          value={totalGroups}
                          onChange={(e) => setTotalGroups(Number(e.target.value))}
                          placeholder="4 (Connections)"
                          required
                        />
                        <Input
                          id="submit-max-mistakes"
                          label="Max Allowed Mistakes (≥1) *"
                          type="number"
                          min={1}
                          max={10}
                          value={maxMistakes}
                          onChange={(e) => setMaxMistakes(Number(e.target.value))}
                          placeholder="4 (Connections)"
                          required
                        />
                        <p className="text-[11px] text-slate-400 sm:col-span-2">
                          Logs track groups cleared (0-{totalGroups}) and number of mistakes made (0-{maxMistakes}).
                        </p>
                      </div>
                    )}

                    {/* High Score / Timed */}
                    {categoryType === "high_score_timed" && (
                      <div className="space-y-2 max-w-md">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                            Score Unit / Metric *
                          </label>
                          <select
                            id="submit-score-type"
                            value={scoreType}
                            onChange={(e) => setScoreType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                          >
                            <option value="Points">Points (SpellTower, Blossom)</option>
                            <option value="Words">Words Found (Squaredle)</option>
                            <option value="Score">Numeric Score</option>
                            <option value="Tiles">Tiles Cleared</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Players input their accumulated numeric score in {scoreType}.
                        </p>
                      </div>
                    )}

                    {/* Competitive Match */}
                    {categoryType === "competitive_match" && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                        <p className="font-semibold text-sm text-white mb-1">Competitive PvP / Match Mode</p>
                        <p className="text-xs text-slate-400">
                          Competitive games are designed for real-time multiplayer rounds or bot matches. No numeric round limits are enforced.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= STEP 4: Metadata & Live Preview ================= */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-0.5">
                      Step 4: Game Metadata & Live Preview
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Provide the title, direct game URL, and summary for players.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Input Fields (col-span-7) */}
                    <div className="lg:col-span-7 space-y-4">
                      <Input
                        id="submit-game-title"
                        label="Game Title (min 2 chars) *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Blossom Word Game, Waffle"
                        required
                      />

                      <Input
                        id="submit-game-url"
                        label="Official Game URL (starts with http) *"
                        type="url"
                        value={gameUrl}
                        onChange={(e) => setGameUrl(e.target.value)}
                        placeholder="https://example.com/play"
                        required
                      />

                      <Input
                        id="submit-game-icon"
                        label="Thumbnail / Icon Image URL (Optional)"
                        type="url"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                        placeholder="https://... (Leave blank for default image)"
                      />

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          Description & Rules Summary (min 10 chars) *
                        </label>
                        <textarea
                          id="submit-game-description"
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Explain the objective and mechanics of this word game in 1-3 sentences..."
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 outline-none resize-none font-sans"
                          required
                        />
                      </div>
                    </div>

                    {/* Right: Sticky Live Card Preview (col-span-5) */}
                    <div className="lg:col-span-5 space-y-2 lg:sticky lg:top-0">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Live Submission Preview
                      </label>
                      {/* Live Preview Card */}
                      <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3.5 shadow-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0">
                            {iconUrl ? (
                              <img
                                src={iconUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80";
                                }}
                              />
                            ) : (
                              <Gamepad2 className="w-6 h-6 text-slate-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-white truncate">
                                {title || "Untitled Game"}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                  getCategoryBadgeStyle(categoryType, categories).bg
                                } ${getCategoryBadgeStyle(categoryType, categories).text} ${
                                  getCategoryBadgeStyle(categoryType, categories).border
                                }`}
                              >
                                {getCategoryTypeLabel(categoryType, categories)}
                              </span>
                              {isDaily ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Daily
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  Casual
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                              {description || "No description provided yet. Enter a description to see how it will appear in the WordTrack catalog."}
                            </p>
                          </div>
                        </div>

                        {/* URL Preview badge */}
                        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Destination</span>
                          <span className="text-emerald-400 truncate max-w-[200px] font-mono text-[10px]">
                            {gameUrl || "https://..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer (shrink-0 border-t) */}
            <div className="shrink-0 border-t border-slate-800 px-5 sm:px-7 py-4 bg-slate-950/80 flex items-center justify-between gap-3">
              {currentStep === 1 ? (
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setCurrentStep((prev) => prev - 1);
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Previous Step</span>
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!isStepValid(currentStep)}
                  onClick={() => {
                    if (!isStepValid(currentStep)) return;
                    setError(null);
                    const nextStep = currentStep + 1;
                    setMaxStepReached((prev) => Math.max(prev, nextStep));
                    setCurrentStep(nextStep);
                  }}
                  className={`font-bold transition-all ${
                    !isStepValid(currentStep)
                      ? "opacity-40 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                  }`}
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  disabled={!isStepValid(4) || pendingCount >= 3 || isSubmitting}
                  onClick={() => handleSubmit()}
                  className={`font-bold transition-all ${
                    !isStepValid(4) || pendingCount >= 3
                      ? "opacity-40 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25"
                  }`}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Submit Game for Review</span>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
