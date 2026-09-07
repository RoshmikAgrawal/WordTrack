import React, { useState, useEffect } from "react";
import { Game, CategoryItem, CATEGORY_DEFINITIONS } from "../../types";
import { Button } from "../ui";
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  ExternalLink,
  Sparkles,
  Check,
  Database,
  Undo2,
  Save,
  AlertCircle,
  Search,
  ShieldCheck,
  Zap,
  Gamepad2,
} from "lucide-react";
import { getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";
import { get10NewUniqueGames } from "../../lib/seedGames";
import { syncAdminGameCatalog } from "../../services/games.service";
import { GameFormModal } from "./GameFormModal";

interface GameManagementTableProps {
  games: Game[];
  categories?: CategoryItem[];
  onRefresh: () => Promise<void> | void;
}

interface UndoSnapshot {
  description: string;
  games: Game[];
  deletedIds: string[];
}

export const GameManagementTable: React.FC<GameManagementTableProps> = ({
  games,
  categories = [],
  onRefresh,
}) => {
  // Staged working copy of games
  const [draftGames, setDraftGames] = useState<Game[]>(games);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDailyFilter, setSelectedDailyFilter] = useState<string>("all");

  // Modals & Operation States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "info" | "warning";
    text: string;
  } | null>(null);

  // Sync draftGames when parent games update if there are no unsaved changes
  useEffect(() => {
    if (undoStack.length === 0 && deletedIds.length === 0) {
      setDraftGames(games);
    }
  }, [games, undoStack.length, deletedIds.length]);

  // Determine if there are unsaved changes
  const hasUnsavedChanges =
    undoStack.length > 0 ||
    deletedIds.length > 0 ||
    JSON.stringify(draftGames) !== JSON.stringify(games);

  // Push state to undo stack before a mutation
  const pushUndo = (description: string) => {
    setUndoStack((prev) => [
      ...prev,
      {
        description,
        games: JSON.parse(JSON.stringify(draftGames)),
        deletedIds: [...deletedIds],
      },
    ]);
  };

  // Undo the last staged action
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousSnapshots = [...undoStack];
    const lastSnapshot = previousSnapshots.pop()!;

    setDraftGames(lastSnapshot.games);
    setDeletedIds(lastSnapshot.deletedIds);
    setUndoStack(previousSnapshots);

    setStatusMessage({
      type: "info",
      text: `Undid action: ${lastSnapshot.description}`,
    });
  };

  // Discard all staged changes and reload live catalog
  const handleDiscardAll = () => {
    if (
      confirm(
        "Are you sure you want to discard all staged changes? This will revert back to the live database."
      )
    ) {
      setDraftGames(games);
      setDeletedIds([]);
      setUndoStack([]);
      setStatusMessage({
        type: "info",
        text: "All staged changes discarded. Reverted to live database.",
      });
    }
  };

  // Toggle active/inactive in draft
  const handleToggleActive = (game: Game) => {
    pushUndo(`Toggle visibility for "${game.title}"`);
    setDraftGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, isActive: !g.isActive } : g))
    );
    setStatusMessage({
      type: "info",
      text: `Set "${game.title}" to ${!game.isActive ? "Active" : "Disabled"} (Staged). Click Save to publish.`,
    });
  };

  // Delete game in draft
  const handleDelete = (gameId: string, title: string) => {
    pushUndo(`Delete game "${title}"`);
    setDraftGames((prev) => prev.filter((g) => g.id !== gameId));
    setDeletedIds((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]));
    setStatusMessage({
      type: "warning",
      text: `Removed "${title}" from draft catalog. Click Save to publish, or Undo to restore.`,
    });
  };

  // Seed 10 NEW unique games (non-overwriting)
  const handleSeed10NewGames = () => {
    pushUndo("Seed 10 new unique word games");
    const newBatch = get10NewUniqueGames(draftGames);

    if (newBatch.length === 0) {
      setStatusMessage({
        type: "info",
        text: "All available curated word games are already added to the catalog.",
      });
      return;
    }

    setDraftGames((prev) => [...prev, ...newBatch]);
    setStatusMessage({
      type: "success",
      text: `Staged ${newBatch.length} new unique word games! Review and click "Save & Publish Changes" to make them live.`,
    });
  };

  // Save staged game from modal (add or edit)
  const handleSaveDraftGame = (stagedGame: Game) => {
    const isEdit = draftGames.some((g) => g.id === stagedGame.id);
    pushUndo(isEdit ? `Edit game "${stagedGame.title}"` : `Add new game "${stagedGame.title}"`);

    if (isEdit) {
      setDraftGames((prev) =>
        prev.map((g) => (g.id === stagedGame.id ? stagedGame : g))
      );
      setStatusMessage({
        type: "info",
        text: `Updated details for "${stagedGame.title}" in staging. Click Save to publish.`,
      });
    } else {
      setDraftGames((prev) => [stagedGame, ...prev]);
      setStatusMessage({
        type: "success",
        text: `Added "${stagedGame.title}" to staging. Click Save to publish.`,
      });
    }
  };

  // Save and publish all staged changes to Firestore
  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      await syncAdminGameCatalog(draftGames, deletedIds);
      setDeletedIds([]);
      setUndoStack([]);
      await onRefresh();
      setStatusMessage({
        type: "success",
        text: "All catalog changes saved & published successfully! Live database updated for all players.",
      });
    } catch (err: any) {
      console.error("Failed to publish catalog changes:", err);
      setStatusMessage({
        type: "warning",
        text: "Error saving changes to database: " + (err?.message || "Permission error"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered games list for the table
  const filteredGames = draftGames.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "all" || (g.categoryType || "classic_single") === selectedType;
    const matchesDaily =
      selectedDailyFilter === "all" ||
      (selectedDailyFilter === "daily" ? g.isDaily : !g.isDaily);
    return matchesSearch && matchesType && matchesDaily;
  });

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Game Catalog Management
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {draftGames.length} Total Games
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Manage game classifications, rules, and daily flags. Staged changes are protected with full Undo before publishing.
            </span>
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Undo Button */}
          <Button
            id="admin-undo-btn"
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

          {/* Seed 10 New Games */}
          <Button
            id="admin-seed-database-btn"
            variant="outline"
            size="sm"
            onClick={handleSeed10NewGames}
            disabled={isSaving}
            className="text-xs border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Seed 10 New Games</span>
          </Button>

          {/* Add New Game */}
          <Button
            id="admin-add-game-btn"
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingGame(null);
              setModalOpen(true);
            }}
            disabled={isSaving}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Game</span>
          </Button>

          {/* Save & Publish Changes */}
          <Button
            id="admin-save-publish-btn"
            variant="primary"
            size="sm"
            onClick={handleSaveAndPublish}
            isLoading={isSaving}
            className={`text-xs font-bold shadow-lg transition-all ${
              hasUnsavedChanges
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50 animate-pulse"
                : "bg-slate-800 text-slate-300 hover:bg-slate-750"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{hasUnsavedChanges ? "Save & Publish Changes" : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">You have unsaved changes in staging.</span>{" "}
              <span className="text-slate-300">
                {deletedIds.length > 0 && `${deletedIds.length} deleted. `}
                {undoStack.length > 0 && `${undoStack.length} staged change(s). `}
                Click <strong>"Save & Publish Changes"</strong> to apply live.
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="admin-search-input"
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Daily vs Casual Filter */}
          <select
            id="admin-daily-filter-select"
            value={selectedDailyFilter}
            onChange={(e) => setSelectedDailyFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Types (Daily & Casual)</option>
            <option value="daily">⚡ Daily Challenges ({draftGames.filter((g) => g.isDaily).length})</option>
            <option value="casual">🎮 Casual / Practice ({draftGames.filter((g) => !g.isDaily).length})</option>
          </select>

          {/* Category Type Filter */}
          <select
            id="admin-category-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories ({draftGames.length})</option>
            {(categories && categories.length > 0
              ? categories.map((cat) => ({ typeKey: cat.id, label: cat.name }))
              : Object.entries(CATEGORY_DEFINITIONS).map(([typeKey, def]) => ({ typeKey, label: def.label }))
            ).map(({ typeKey, label }) => (
              <option key={typeKey} value={typeKey}>
                {label} ({draftGames.filter((g) => (g.categoryType || "classic_single") === typeKey || g.category?.toLowerCase() === label.toLowerCase()).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Game</th>
                <th className="py-3.5 px-4 font-bold">Classification</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold text-center">Config Details</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No games match your search. Try adjusting filters or click "Seed 10 New Games".
                  </td>
                </tr>
              ) : (
                filteredGames.map((game) => {
                  const catType = game.categoryType || "classic_single";
                  const catStyle = getCategoryBadgeStyle(catType, categories);
                  const catLabel = getCategoryTypeLabel(catType, categories, game.category);
                  const isNewlyAdded = !games.some((g) => g.id === game.id);

                  return (
                    <tr
                      key={game.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isNewlyAdded ? "bg-emerald-500/[0.03]" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            {game.iconUrl ? (
                              <img
                                src={game.iconUrl}
                                alt={game.title}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <span className="font-bold text-emerald-400 font-mono">
                                {game.title.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{game.title}</span>
                              {isNewlyAdded && (
                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                                  Staged
                                </span>
                              )}
                              <a
                                href={game.gameUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-slate-300"
                                title="Open Official Game Site"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {game.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Daily vs Casual Flag */}
                      <td className="py-3.5 px-4">
                        {game.isDaily ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <Zap className="w-3 h-3" />
                            <span>Daily Challenge</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                            <Gamepad2 className="w-3 h-3" />
                            <span>Casual / Practice</span>
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {catLabel}
                        </span>
                      </td>

                      {/* Config summary */}
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-300">
                        {catType === "classic_single" && `${game.categoryConfig?.maxAttempts || game.maxAttempts || 6} tries`}
                        {catType === "multi_board" && `${game.categoryConfig?.totalBoards || 4} boards / ${game.categoryConfig?.maxAttempts || 9} tries`}
                        {catType === "unlimited_steps" && `Metric: ${game.categoryConfig?.stepMetricLabel || "Guesses"}`}
                        {catType === "grouping_deduction" && `${game.categoryConfig?.totalGroups || 4} grps / ${game.categoryConfig?.maxMistakes || 4} mistakes`}
                        {catType === "high_score_timed" && `Unit: ${game.categoryConfig?.scoreType || "Points"}`}
                        {catType === "competitive_match" && "PvP / Match"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(game)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            game.isActive !== false
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{game.isActive !== false ? "Active" : "Disabled"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGame(game);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Game Setup"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(game.id, game.title)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove Game"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Game Edit / Add Modal */}
      {modalOpen && (
        <GameFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingGame(null);
          }}
          game={editingGame}
          categories={categories}
          onSaveDraft={handleSaveDraftGame}
        />
      )}
    </div>
  );
};
