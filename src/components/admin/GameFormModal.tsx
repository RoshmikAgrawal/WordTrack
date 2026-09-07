import React, { useState, useEffect } from "react";
import { Game, GameCategoryType, CategoryConfig, CategoryItem, CATEGORY_DEFINITIONS } from "../../types";
import { Modal } from "../ui/Modal";
import { Button, Input } from "../ui";
import { saveGame } from "../../services/games.service";
import {
  Sparkles,
  Zap,
  Gamepad2,
  Layers,
  HelpCircle,
  Check,
  Globe,
  Image as ImageIcon,
  FileText,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";

interface GameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  game?: Game | null;
  categories?: CategoryItem[];
  onSaveDraft?: (game: Game) => void;
  onSaved?: () => void;
}

export const GameFormModal: React.FC<GameFormModalProps> = ({
  isOpen,
  onClose,
  game,
  categories,
  onSaveDraft,
  onSaved,
}) => {
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

  // Step 1: Daily Flag
  const [isDaily, setIsDaily] = useState<boolean>(true);

  // Step 2: Category
  const [categoryType, setCategoryType] = useState<GameCategoryType>("classic_single");

  // Step 3: Dynamic Config
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
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (game) {
      setIsDaily(game.isDaily !== false);
      const catType = game.categoryType || "classic_single";
      setCategoryType(catType);
      const effectiveData = getEffectiveCategoryData(catType);

      const cfg = game.categoryConfig || {};
      setMaxAttempts(cfg.maxAttempts || game.maxAttempts || effectiveData.defaultConfig.maxAttempts || 6);
      setTotalBoards(cfg.totalBoards || effectiveData.defaultConfig.totalBoards || 4);
      setTotalGroups(cfg.totalGroups || effectiveData.defaultConfig.totalGroups || 4);
      setMaxMistakes(cfg.maxMistakes || effectiveData.defaultConfig.maxMistakes || 4);
      setStepMetricLabel(cfg.stepMetricLabel || effectiveData.defaultConfig.stepMetricLabel || "Guesses");
      setScoreType(cfg.scoreType || effectiveData.defaultConfig.scoreType || "Points");

      setTitle(game.title);
      setGameUrl(game.gameUrl);
      setIconUrl(game.iconUrl || "");
      setDescription(game.description || "");
      setIsActive(game.isActive !== false);
    } else {
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
      setIsActive(true);
    }
    setError(null);
  }, [game, isOpen, categories]);

  // When category changes, load values & defaults configured in category management
  const handleCategoryChange = (newType: GameCategoryType) => {
    setCategoryType(newType);
    const catData = getEffectiveCategoryData(newType);

    if (!game) {
      setIsDaily(catData.defaultDaily);
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !gameUrl.trim()) {
      setError("Please provide both a Title and a valid Game URL.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const generatedId =
        game?.id ||
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-") + `-${Date.now().toString(36).slice(-4)}`;

      // Build structured CategoryConfig
      const categoryConfig: CategoryConfig = {};
      let effectiveMaxAttempts = 6;

      if (categoryType === "classic_single") {
        categoryConfig.maxAttempts = Number(maxAttempts) || 6;
        effectiveMaxAttempts = categoryConfig.maxAttempts;
      } else if (categoryType === "multi_board") {
        categoryConfig.totalBoards = Number(totalBoards) || 4;
        categoryConfig.maxAttempts = Number(maxAttempts) || 9;
        effectiveMaxAttempts = categoryConfig.maxAttempts;
      } else if (categoryType === "unlimited_steps") {
        categoryConfig.stepMetricLabel = stepMetricLabel.trim() || "Guesses";
        effectiveMaxAttempts = 30;
      } else if (categoryType === "grouping_deduction") {
        categoryConfig.totalGroups = Number(totalGroups) || 4;
        categoryConfig.maxMistakes = Number(maxMistakes) || 4;
        effectiveMaxAttempts = categoryConfig.maxMistakes;
      } else if (categoryType === "high_score_timed") {
        categoryConfig.scoreType = scoreType.trim() || "Points";
        effectiveMaxAttempts = 10;
      }

      const stagedGame: Game = {
        id: game?.id || generatedId,
        title: title.trim(),
        description: description.trim(),
        gameUrl: gameUrl.trim(),
        isDaily,
        categoryType,
        categoryConfig,
        category: getCategoryTypeLabel(categoryType, categories),
        iconUrl:
          iconUrl.trim() ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
        maxAttempts: effectiveMaxAttempts,
        isActive,
        colorTheme: game?.colorTheme || "from-emerald-500 to-teal-600",
        createdAt: game?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onSaveDraft) {
        onSaveDraft(stagedGame);
        onClose();
      } else {
        await saveGame(stagedGame);
        if (onSaved) onSaved();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save game. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {game ? `Edit "${game.title}"` : "Configure & Add Word Game"}
            </h3>
            <p className="text-xs text-slate-400">
              4-Step structured setup: Game Type, Category, Rules & Metadata.
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2 max-h-[78vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ================= LEFT COLUMN: Category & Rules (Steps 1, 2, 3) ================= */}
          <div className="lg:col-span-6 space-y-6">
            {/* ================= STEP 1: Daily Flag Selection ================= */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Game Type & Loggability</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isDaily ? "⚡ Daily Challenge" : "🎮 Casual / Practice"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Daily Challenge Card */}
                <button
                  id="admin-game-type-daily-btn"
                  type="button"
                  onClick={() => setIsDaily(true)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isDaily
                      ? "bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/40"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isDaily ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold ${isDaily ? "text-white" : "text-slate-300"}`}>
                        Daily Challenge
                      </span>
                    </div>
                    {isDaily && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Appears on Daily Tracker. Tracks streaks, daily score logs, and calendar recaps.
                  </p>
                </button>

                {/* Casual / Practice Card */}
                <button
                  id="admin-game-type-casual-btn"
                  type="button"
                  onClick={() => setIsDaily(false)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    !isDaily
                      ? "bg-indigo-500/15 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/40"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${!isDaily ? "bg-indigo-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
                        <Gamepad2 className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold ${!isDaily ? "text-white" : "text-slate-300"}`}>
                        Casual / Practice
                      </span>
                    </div>
                    {!isDaily && <Check className="w-4 h-4 text-indigo-400 stroke-[3]" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    PvP battles, unlimited practice, or speed rounds. <strong>Never loggable</strong> in daily journal.
                  </p>
                </button>
              </div>
            </div>

            {/* ================= STEP 2: Category Selection ================= */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">2</span>
                <span>Gameplay Category</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      onClick={() => handleCategoryChange(catKey)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? `${catBadge.bg} ${catBadge.border} ring-1 ${catBadge.ring} shadow-md`
                          : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${catBadge.dot}`} />
                          <span className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-300"}`}>
                            {catData.label}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />}
                      </div>
                      <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed">
                        {catData.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================= STEP 3: Dynamic Category Configuration ================= */}
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Dynamic Configuration ({getCategoryTypeLabel(categoryType, categories)})</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Rules</span>
              </div>

              {/* Condition 1: Classic Single Board */}
              {categoryType === "classic_single" && (
                <div className="space-y-2">
                  <Input
                    id="config-max-attempts"
                    label="Max Attempts (Guesses allowed) *"
                    type="number"
                    min={1}
                    max={30}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    placeholder="e.g. 6 (Wordle), 8 (Word500), 15 (Waffle)"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Players will record tries taken from 1 to {maxAttempts} or mark as failed.
                  </p>
                </div>
              )}

              {/* Condition 2: Multi-Board Grid */}
              {categoryType === "multi_board" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="config-total-boards"
                    label="Total Boards (Grids) *"
                    type="number"
                    min={2}
                    max={32}
                    value={totalBoards}
                    onChange={(e) => setTotalBoards(Number(e.target.value))}
                    placeholder="e.g. 4 (Quordle), 8 (Octordle)"
                    required
                  />
                  <Input
                    id="config-multi-max-attempts"
                    label="Total Attempts Allowed *"
                    type="number"
                    min={1}
                    max={40}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    placeholder="e.g. 9 (Quordle), 13 (Octordle)"
                    required
                  />
                  <p className="text-[11px] text-slate-400 sm:col-span-2">
                    Logs will record both total boards cleared (0-{totalBoards}) and total attempts used (1-{maxAttempts}).
                  </p>
                </div>
              )}

              {/* Condition 3: Unlimited Steps / Ladder */}
              {categoryType === "unlimited_steps" && (
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="config-step-metric"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                      >
                        Step Metric Label *
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {stepMetricLabel.length} / 24 chars
                      </span>
                    </div>
                    <input
                      id="config-step-metric"
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

              {/* Condition 4: Grouping & Deduction */}
              {categoryType === "grouping_deduction" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="config-total-groups"
                    label="Total Groups to Find *"
                    type="number"
                    min={2}
                    max={8}
                    value={totalGroups}
                    onChange={(e) => setTotalGroups(Number(e.target.value))}
                    placeholder="4 (Connections)"
                    required
                  />
                  <Input
                    id="config-max-mistakes"
                    label="Max Allowed Mistakes *"
                    type="number"
                    min={1}
                    max={10}
                    value={maxMistakes}
                    onChange={(e) => setMaxMistakes(Number(e.target.value))}
                    placeholder="4 (Connections)"
                    required
                  />
                  <p className="text-[11px] text-slate-400 sm:col-span-2">
                    Logs will track groups cleared (0-{totalGroups}) and number of mistakes made (0-{maxMistakes}).
                  </p>
                </div>
              )}

              {/* Condition 5: High Score / Timed */}
              {categoryType === "high_score_timed" && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Score Unit / Metric *
                    </label>
                    <select
                      id="config-score-type"
                      value={scoreType}
                      onChange={(e) => setScoreType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                    >
                      <option value="Points">Points (SpellTower, Blossom)</option>
                      <option value="Words">Words Found (Squaredle)</option>
                      <option value="Score">Numeric Score</option>
                      <option value="Tiles">Tiles Cleared</option>
                      {scoreType && !["Points", "Words", "Score", "Tiles"].includes(scoreType) && (
                        <option value={scoreType}>{scoreType} (Custom)</option>
                      )}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Players input their accumulated numeric score in {scoreType}.
                  </p>
                </div>
              )}

              {/* Condition 6: Competitive Match */}
              {categoryType === "competitive_match" && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                  <p className="font-semibold">Competitive PvP / Match Mode</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Competitive games are designed for real-time multiplayer rounds or bot matches.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Metadata & Preview (Step 4) ================= */}
          <div className="lg:col-span-6 space-y-6">
            {/* ================= STEP 4: Core Metadata ================= */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">4</span>
                <span>Game Metadata & Direct Links</span>
              </label>

              <Input
                id="game-form-title"
                label="Game Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Wordle, Octordle, Connections"
                required
              />

              <Input
                id="game-form-url"
                label="Official Game URL (Direct Outbound Link) *"
                type="url"
                value={gameUrl}
                onChange={(e) => setGameUrl(e.target.value)}
                placeholder="https://www.nytimes.com/games/wordle/index.html"
                required
              />

              <div className="space-y-1.5">
                <Input
                  id="game-form-icon"
                  label="Thumbnail / Icon Image URL"
                  type="url"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (Optional)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description & Rules Summary
                </label>
                <textarea
                  id="game-form-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief explanation of how the game is played..."
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none resize-none font-sans"
                />
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live Card Preview</span>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80";
                        }}
                      />
                    ) : (
                      <Gamepad2 className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {title || "Untitled Game"}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getCategoryBadgeStyle(categoryType, categories).bg} ${getCategoryBadgeStyle(categoryType, categories).text} ${getCategoryBadgeStyle(categoryType, categories).border}`}>
                        {getCategoryTypeLabel(categoryType, categories)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {description || "No description provided yet."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="game-form-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 text-emerald-600 focus:ring-emerald-500 bg-slate-950 cursor-pointer"
                />
                <label htmlFor="game-form-active" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Publish as Active (Visible in catalog & daily tracker)
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl font-medium">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {game ? "Update Game" : "Add Game"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
