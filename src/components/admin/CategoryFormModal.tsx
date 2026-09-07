import React, { useState, useEffect } from "react";
import { CategoryItem, CategoryColorKey, CategoryConfig } from "../../types";
import { Modal } from "../ui/Modal";
import { Button, Input } from "../ui";
import { CATEGORY_COLOR_PALETTES } from "../../lib/utils";
import { Check, Palette, Zap, Gamepad2, BookOpen, Ban, Settings2 } from "lucide-react";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryItem | null;
  onSaveDraft: (category: CategoryItem) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  category,
  onSaveDraft,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorKey, setColorKey] = useState<CategoryColorKey>("emerald");
  const [defaultDaily, setDefaultDaily] = useState<boolean>(true);
  const [loggable, setLoggable] = useState<boolean>(true);
  const [defaultConfig, setDefaultConfig] = useState<CategoryConfig>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setColorKey((category.colorKey as CategoryColorKey) || "emerald");
      setDefaultDaily(category.defaultDaily ?? true);
      setLoggable(category.loggable ?? true);
      setDefaultConfig(category.defaultConfig ? { ...category.defaultConfig } : {});
    } else {
      setName("");
      setDescription("");
      setColorKey("emerald");
      setDefaultDaily(true);
      setLoggable(true);
      setDefaultConfig({});
    }
    setError(null);
  }, [category, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a Category Name.");
      return;
    }

    const generatedId =
      category?.id ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_");

    const stagedCategory: CategoryItem = {
      id: category?.id || generatedId,
      name: name.trim(),
      description: description.trim(),
      colorKey,
      defaultDaily,
      loggable,
      defaultConfig,
      order: category?.order ?? 99,
      updatedAt: new Date().toISOString(),
    };

    onSaveDraft(stagedCategory);
    onClose();
  };

  const selectedPalette = CATEGORY_COLOR_PALETTES[colorKey] || CATEGORY_COLOR_PALETTES.emerald;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? `Edit Category: "${category.name}"` : "Edit Category"}
      description="Customize category display name, badge styling, rules presets, and gameplay behaviors."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Category Type ID (read-only indicator) */}
        {category?.id && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Category ID:</span>
            <code className="text-emerald-400 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {category.id}
            </code>
          </div>
        )}

        <Input
          id="category-form-name"
          label="Category Name / Label *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Classic Single-Board, Multi-Board Grid..."
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Category Description (Optional)
          </label>
          <textarea
            id="category-form-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief explanation of gameplay, boards, or rules in this category..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none resize-none"
          />
        </div>

        {/* Behavior & Mode Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Default Mode: Daily Challenge vs Casual */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Default Game Classification
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setDefaultDaily(true)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  defaultDaily
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Daily</span>
              </button>
              <button
                type="button"
                onClick={() => setDefaultDaily(false)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !defaultDaily
                    ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Casual</span>
              </button>
            </div>
          </div>

          {/* Daily Tracker & Diary Logging */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Tracker & Diary Logging
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setLoggable(true)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  loggable
                    ? "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Enabled</span>
              </button>
              <button
                type="button"
                onClick={() => setLoggable(false)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !loggable
                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Disabled</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Config Presets */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Category Rule Presets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Max Attempts / Boards */}
            {(category?.id === "classic_single" || category?.id === "multi_board" || !category?.id) && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Default Attempts
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={defaultConfig.maxAttempts ?? (category?.id === "multi_board" ? 9 : 6)}
                  onChange={(e) =>
                    setDefaultConfig((prev) => ({
                      ...prev,
                      maxAttempts: parseInt(e.target.value, 10) || 6,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {category?.id === "multi_board" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Total Boards
                </label>
                <input
                  type="number"
                  min={2}
                  max={16}
                  value={defaultConfig.totalBoards ?? 4}
                  onChange={(e) =>
                    setDefaultConfig((prev) => ({
                      ...prev,
                      totalBoards: parseInt(e.target.value, 10) || 4,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {category?.id === "unlimited_steps" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Step Metric Label
                </label>
                <input
                  type="text"
                  value={defaultConfig.stepMetricLabel ?? "Guesses"}
                  onChange={(e) =>
                    setDefaultConfig((prev) => ({
                      ...prev,
                      stepMetricLabel: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                  placeholder="e.g. Guesses, Steps, Closeness"
                />
              </div>
            )}

            {category?.id === "grouping_deduction" && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Total Groups
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={defaultConfig.totalGroups ?? 4}
                    onChange={(e) =>
                      setDefaultConfig((prev) => ({
                        ...prev,
                        totalGroups: parseInt(e.target.value, 10) || 4,
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Max Mistakes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={defaultConfig.maxMistakes ?? 4}
                    onChange={(e) =>
                      setDefaultConfig((prev) => ({
                        ...prev,
                        maxMistakes: parseInt(e.target.value, 10) || 4,
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            {category?.id === "high_score_timed" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Score Type Metric
                </label>
                <input
                  type="text"
                  value={defaultConfig.scoreType ?? "Points"}
                  onChange={(e) =>
                    setDefaultConfig((prev) => ({
                      ...prev,
                      scoreType: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                  placeholder="e.g. Points, Words, Score"
                />
              </div>
            )}
          </div>
        </div>

        {/* Color Palette Picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Label Badge Color</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-300 font-mono">
              {selectedPalette.label}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
            {Object.entries(CATEGORY_COLOR_PALETTES).map(([key, palette]) => {
              const isSelected = colorKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColorKey(key as CategoryColorKey)}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? `bg-slate-900 ${palette.border} ring-2 ${palette.ring} scale-105 shadow-md`
                      : "bg-slate-950/60 border-slate-800/70 hover:bg-slate-900 hover:border-slate-700"
                  }`}
                  title={palette.label}
                >
                  <div className={`w-5 h-5 rounded-full ${palette.dot} flex items-center justify-center shadow-inner`}>
                    {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                  </div>
                  <span className="text-[9px] font-medium text-slate-400 group-hover:text-slate-200 mt-1 truncate max-w-[50px]">
                    {key}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Badge Preview */}
        <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
            Live Badge Preview
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg border ${selectedPalette.bg} ${selectedPalette.text} ${selectedPalette.border} shadow-sm`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedPalette.dot}`} />
              <span>{name.trim() || "Category Preview"}</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Appears on game cards, filter chips, and daily score summaries
            </span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl font-medium">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {category ? "Update Category" : "Save Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
