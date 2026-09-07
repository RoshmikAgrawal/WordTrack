import React, { useState, useEffect } from "react";
import { CategoryItem, Game } from "../../types";
import { Button } from "../ui";
import { Modal } from "../ui/Modal";
import {
  Edit2,
  Trash2,
  Undo2,
  Save,
  Tag,
  AlertCircle,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Palette,
  Gamepad2,
  AlertTriangle,
  Zap,
  BookOpen,
  Ban,
  Settings2,
} from "lucide-react";
import { CATEGORY_COLOR_PALETTES } from "../../lib/utils";
import {
  DEFAULT_CATEGORIES,
  syncAdminCategories,
} from "../../services/categories.service";
import { CategoryFormModal } from "./CategoryFormModal";

interface CategoryManagementSectionProps {
  categories: CategoryItem[];
  games: Game[];
  onRefresh: () => Promise<void> | void;
  onGamesUpdated?: (games: Game[]) => void;
}

interface UndoCategorySnapshot {
  description: string;
  categories: CategoryItem[];
  deletedIds: string[];
}

export const CategoryManagementSection: React.FC<CategoryManagementSectionProps> = ({
  categories,
  games,
  onRefresh,
  onGamesUpdated,
}) => {
  // Staged working copy
  const [draftCategories, setDraftCategories] = useState<CategoryItem[]>(categories);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<UndoCategorySnapshot[]>([]);

  // Modals & Status
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "info" | "warning";
    text: string;
  } | null>(null);

  // Sync draft when parent updates if clean
  useEffect(() => {
    if (undoStack.length === 0 && deletedIds.length === 0) {
      setDraftCategories(categories);
    }
  }, [categories, undoStack.length, deletedIds.length]);

  const hasUnsavedChanges =
    undoStack.length > 0 ||
    deletedIds.length > 0 ||
    JSON.stringify(draftCategories.map((c) => ({ id: c.id, name: c.name, colorKey: c.colorKey, defaultDaily: c.defaultDaily, loggable: c.loggable }))) !==
      JSON.stringify(categories.map((c) => ({ id: c.id, name: c.name, colorKey: c.colorKey, defaultDaily: c.defaultDaily, loggable: c.loggable })));

  const pushUndo = (description: string) => {
    setUndoStack((prev) => [
      ...prev,
      {
        description,
        categories: JSON.parse(JSON.stringify(draftCategories)),
        deletedIds: [...deletedIds],
      },
    ]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousSnapshots = [...undoStack];
    const lastSnapshot = previousSnapshots.pop()!;

    setDraftCategories(lastSnapshot.categories);
    setDeletedIds(lastSnapshot.deletedIds);
    setUndoStack(previousSnapshots);

    setStatusMessage({
      type: "info",
      text: `Undid action: ${lastSnapshot.description}`,
    });
  };

  const handleDiscardAll = () => {
    pushUndo("Discard staged changes");
    setDraftCategories(categories);
    setDeletedIds([]);
    setStatusMessage({
      type: "info",
      text: "Staged category changes discarded. Reverted to live database. (Click Undo if this was accidental)",
    });
  };

  const handleResetToDefaults = () => {
    pushUndo("Reset categories to default presets");
    setDraftCategories([...DEFAULT_CATEGORIES]);
    setStatusMessage({
      type: "info",
      text: "Reset categories to 6 default presets (Staged). Click Save to publish.",
    });
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    setCategoryToDelete(cat);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const catId = categoryToDelete.id;
    const name = categoryToDelete.name;

    pushUndo(`Delete category "${name}"`);
    setDraftCategories((prev) => prev.filter((c) => c.id !== catId));
    setDeletedIds((prev) => (prev.includes(catId) ? prev : [...prev, catId]));
    setStatusMessage({
      type: "warning",
      text: `Removed category "${name}" from staging. Click Save to publish, or Undo to restore.`,
    });
    setCategoryToDelete(null);
  };

  const handleSaveDraftCategory = (stagedCat: CategoryItem) => {
    const isEdit = draftCategories.some((c) => c.id === stagedCat.id);
    pushUndo(isEdit ? `Edit category "${stagedCat.name}"` : `Update category "${stagedCat.name}"`);

    if (isEdit) {
      setDraftCategories((prev) =>
        prev.map((c) => (c.id === stagedCat.id ? stagedCat : c))
      );
      setStatusMessage({
        type: "info",
        text: `Updated "${stagedCat.name}" in staging. Click Save to publish.`,
      });
    } else {
      setDraftCategories((prev) => [...prev, stagedCat]);
      setStatusMessage({
        type: "success",
        text: `Updated category "${stagedCat.name}" in staging. Click Save to publish.`,
      });
    }
  };

  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      const result = await syncAdminCategories(draftCategories, deletedIds, games, categories);
      setDeletedIds([]);
      setUndoStack([]);

      // Immediately propagate updated games to the parent state and components
      if (onGamesUpdated && result.updatedGames) {
        onGamesUpdated(result.updatedGames);
      }

      await onRefresh();

      if (result.affectedGamesCount > 0) {
        setStatusMessage({
          type: "success",
          text: `Categories saved! Updated ${result.affectedGamesCount} game(s) with new category tags across the app.`,
        });
      } else {
        setStatusMessage({
          type: "success",
          text: "Categories & custom rules saved & published successfully!",
        });
      }
    } catch (err: any) {
      console.error("Failed to save categories:", err);
      setStatusMessage({
        type: "warning",
        text: "Error saving categories: " + (err?.message || "Permission error"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="admin-category-management-section" className="space-y-6 pt-4 border-t border-slate-800/80">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Category Management
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {draftCategories.length} Categories
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              Manage game categories, rule presets, badge styling, and game assignments.
            </span>
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Undo Button */}
          <Button
            id="admin-category-undo-btn"
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0 || isSaving}
            className={`text-xs ${
              undoStack.length > 0
                ? "border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                : "opacity-40"
            }`}
            title={
              undoStack.length > 0
                ? `Undo: ${undoStack[undoStack.length - 1].description}`
                : "No actions to undo"
            }
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo {undoStack.length > 0 ? `(${undoStack.length})` : ""}</span>
          </Button>

          {/* Save & Publish Categories */}
          <Button
            id="admin-save-categories-btn"
            variant="primary"
            size="sm"
            onClick={handleSaveAndPublish}
            isLoading={isSaving}
            className={`text-xs font-bold shadow-lg transition-all ${
              hasUnsavedChanges
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25 ring-2 ring-purple-400/50 animate-pulse"
                : "bg-slate-800 text-slate-300 hover:bg-slate-750"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{hasUnsavedChanges ? "Save & Publish Categories" : "Save Categories"}</span>
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">You have unsaved category changes.</span>{" "}
              <span className="text-slate-300">
                {deletedIds.length > 0 && `${deletedIds.length} category deleted. `}
                {undoStack.length > 0 && `${undoStack.length} staged change(s). `}
                Click <strong>"Save & Publish Categories"</strong> to apply across the app.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUndo}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Undo Last Action
            </button>
            <button
              onClick={handleDiscardAll}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition-colors cursor-pointer"
            >
              Discard All
            </button>
          </div>
        </div>
      )}

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 border ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : statusMessage.type === "warning"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" && <Check className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === "warning" && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {statusMessage.type === "info" && <Sparkles className="w-4 h-4 text-blue-400" />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-[11px] font-bold px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {draftCategories.map((cat) => {
          const palette =
            CATEGORY_COLOR_PALETTES[cat.colorKey] || CATEGORY_COLOR_PALETTES.emerald;
          const origCat = categories.find((c) => c.id === cat.id);
          const assignedGamesCount = games.filter(
            (g) =>
              (g.categoryType && g.categoryType === cat.id) ||
              g.category?.toLowerCase() === cat.name.toLowerCase() ||
              (origCat && g.category?.toLowerCase() === origCat.name.toLowerCase())
          ).length;

          const isDaily = cat.defaultDaily !== false;
          const isLoggable = cat.loggable !== false;

          return (
            <div
              key={cat.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-lg shadow-black/20"
            >
              <div className="space-y-2.5">
                {/* Category Header: Badge & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border ${palette.bg} ${palette.text} ${palette.border} shadow-sm self-start`}
                    >
                      <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {cat.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`admin-edit-category-${cat.id}`}
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Category Name, Color & Rules"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`admin-delete-category-${cat.id}`}
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {cat.description || "No description provided."}
                </p>

                {/* Category Attributes & Config Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {/* Daily vs Casual */}
                  {isDaily ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      <Zap className="w-2.5 h-2.5" />
                      <span>Daily Challenge</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                      <Gamepad2 className="w-2.5 h-2.5" />
                      <span>Casual / Practice</span>
                    </span>
                  )}

                  {/* Loggable */}
                  {isLoggable ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/25">
                      <BookOpen className="w-2.5 h-2.5" />
                      <span>Tracker Loggable</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/25">
                      <Ban className="w-2.5 h-2.5" />
                      <span>No Logging</span>
                    </span>
                  )}

                  {/* Config details */}
                  {cat.defaultConfig?.maxAttempts && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {cat.defaultConfig.maxAttempts} Tries
                    </span>
                  )}
                  {cat.defaultConfig?.totalBoards && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {cat.defaultConfig.totalBoards} Boards
                    </span>
                  )}
                  {cat.defaultConfig?.stepMetricLabel && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {cat.defaultConfig.stepMetricLabel}
                    </span>
                  )}
                  {cat.defaultConfig?.totalGroups && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {cat.defaultConfig.totalGroups} Grps / {cat.defaultConfig.maxMistakes ?? 4} Err
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Color info & games count */}
              <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                  <span className="text-slate-300 font-medium">{palette.label}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                  <Gamepad2 className="w-3 h-3 text-slate-500" />
                  <span>
                    <strong>{assignedGamesCount}</strong> {assignedGamesCount === 1 ? "game" : "games"}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Edit Modal */}
      {modalOpen && (
        <CategoryFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
          category={editingCategory}
          onSaveDraft={handleSaveDraftCategory}
        />
      )}

      {/* Category Delete Confirmation Modal */}
      {categoryToDelete && (
        <Modal
          isOpen={categoryToDelete !== null}
          onClose={() => setCategoryToDelete(null)}
          title={
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-white">Delete Category</span>
            </div>
          }
          description="Confirm removal of category from staging"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border ${
                    (CATEGORY_COLOR_PALETTES[categoryToDelete.colorKey] || CATEGORY_COLOR_PALETTES.emerald).bg
                  } ${
                    (CATEGORY_COLOR_PALETTES[categoryToDelete.colorKey] || CATEGORY_COLOR_PALETTES.emerald).text
                  } ${
                    (CATEGORY_COLOR_PALETTES[categoryToDelete.colorKey] || CATEGORY_COLOR_PALETTES.emerald).border
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      (CATEGORY_COLOR_PALETTES[categoryToDelete.colorKey] || CATEGORY_COLOR_PALETTES.emerald).dot
                    }`}
                  />
                  <span>{categoryToDelete.name}</span>
                </span>
              </div>
            </div>

            {(() => {
              const count = games.filter(
                (g) =>
                  (g.categoryType && g.categoryType === categoryToDelete.id) ||
                  g.category?.toLowerCase() === categoryToDelete.name.toLowerCase() ||
                  g.category?.toLowerCase() === categoryToDelete.id.toLowerCase()
              ).length;

              if (count > 0) {
                return (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">
                        {count} {count === 1 ? "game is" : "games are"} currently tagged with "{categoryToDelete.name}"
                      </p>
                      <p className="text-amber-300/80 leading-relaxed">
                        When you delete and save, all affected games will have their category automatically reassigned so players can still find them.
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-200">"{categoryToDelete.name}"</strong>? This will stage the deletion, which you can undo or publish with "Save & Publish".
                </p>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <Button
                id="cancel-delete-category-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCategoryToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                id="confirm-delete-category-btn"
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteCategory}
                className="bg-rose-600 hover:bg-rose-500 text-white border-transparent"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Category</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

