import React, { useState, useEffect } from "react";
import {
  GameSubmission,
  SubmissionStatus,
  CategoryItem,
  GameCategoryType,
  CategoryConfig,
  CATEGORY_DEFINITIONS,
  Game,
} from "../../types";
import {
  subscribeToAllSubmissionsAdmin,
  approveSubmission,
  rejectSubmission,
} from "../../services/submissions.service";
import { Button, Input, Card, Badge } from "../ui";
import { Modal } from "../ui/Modal";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Edit3,
  Search,
  Sliders,
  Send,
  User,
  Mail,
  Calendar,
  AlertCircle,
  Gamepad2,
  Zap,
  Check,
  Eye,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getCategoryBadgeStyle, getCategoryTypeLabel } from "../../lib/utils";

interface SubmissionsReviewTableProps {
  categories?: CategoryItem[];
  onGameApproved?: () => void;
}

export const SubmissionsReviewTable: React.FC<SubmissionsReviewTableProps> = ({
  categories = [],
  onGameApproved,
}) => {
  const [submissions, setSubmissions] = useState<GameSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect / Edit / Approve Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<GameSubmission | null>(null);

  // Editable fields in inspect modal
  const [editTitle, setEditTitle] = useState<string>("");
  const [editGameUrl, setEditGameUrl] = useState<string>("");
  const [editIconUrl, setEditIconUrl] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editIsDaily, setEditIsDaily] = useState<boolean>(true);
  const [editCategoryType, setEditCategoryType] = useState<GameCategoryType>("classic_single");
  const [editMaxAttempts, setEditMaxAttempts] = useState<number>(6);
  const [editTotalBoards, setEditTotalBoards] = useState<number>(4);
  const [editTotalGroups, setEditTotalGroups] = useState<number>(4);
  const [editMaxMistakes, setEditMaxMistakes] = useState<number>(4);
  const [editStepMetricLabel, setEditStepMetricLabel] = useState<string>("Guesses");
  const [editScoreType, setEditScoreType] = useState<string>("Points");
  const [adminFeedback, setAdminFeedback] = useState<string>("");

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectFeedback, setRejectFeedback] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Subscribe to real-time submissions
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllSubmissionsAdmin(
      (list) => {
        setSubmissions(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper for category defaults
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

  const openInspectModal = (sub: GameSubmission) => {
    setSelectedSubmission(sub);
    setEditTitle(sub.title);
    setEditGameUrl(sub.gameUrl);
    setEditIconUrl(sub.iconUrl || "");
    setEditDescription(sub.description);
    setEditIsDaily(sub.isDaily !== false);
    setEditCategoryType(sub.categoryType);

    const cfg = sub.categoryConfig || {};
    setEditMaxAttempts(cfg.maxAttempts || 6);
    setTotalBoards(cfg.totalBoards || 4);
    setTotalGroups(cfg.totalGroups || 4);
    setMaxMistakes(cfg.maxMistakes || 4);
    setStepMetricLabel(cfg.stepMetricLabel || "Guesses");
    setScoreType(cfg.scoreType || "Points");
    setAdminFeedback(sub.adminFeedback || "");

    setActionError(null);
    setInspectModalOpen(true);
  };

  const setTotalBoards = (n: number) => setEditTotalBoards(n);
  const setTotalGroups = (n: number) => setEditTotalGroups(n);
  const setMaxMistakes = (n: number) => setEditMaxMistakes(n);
  const setStepMetricLabel = (s: string) => setEditStepMetricLabel(s);
  const setScoreType = (s: string) => setEditScoreType(s);

  const openRejectModal = (sub: GameSubmission) => {
    setSelectedSubmission(sub);
    setRejectFeedback(
      sub.adminFeedback ||
        "Thank you for submitting! Unfortunately, this game does not currently meet our catalog inclusion criteria."
    );
    setActionError(null);
    setRejectModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    if (!editTitle.trim() || !editGameUrl.trim()) {
      setActionError("Title and Game URL are required.");
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      // Build dynamic category config
      const categoryConfig: CategoryConfig = {};
      if (editCategoryType === "classic_single") {
        categoryConfig.maxAttempts = Number(editMaxAttempts) || 6;
      } else if (editCategoryType === "multi_board") {
        categoryConfig.totalBoards = Number(editTotalBoards) || 4;
        categoryConfig.maxAttempts = Number(editMaxAttempts) || 9;
      } else if (editCategoryType === "unlimited_steps") {
        categoryConfig.stepMetricLabel = editStepMetricLabel.trim() || "Guesses";
      } else if (editCategoryType === "grouping_deduction") {
        categoryConfig.totalGroups = Number(editTotalGroups) || 4;
        categoryConfig.maxMistakes = Number(editMaxMistakes) || 4;
      } else if (editCategoryType === "high_score_timed") {
        categoryConfig.scoreType = editScoreType.trim() || "Points";
      }

      const editedGameData: Partial<Game> = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        gameUrl: editGameUrl.trim(),
        iconUrl: editIconUrl.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
        isDaily: editIsDaily,
        categoryType: editCategoryType,
        categoryConfig,
        isActive: true,
      };

      await approveSubmission(selectedSubmission, editedGameData);

      setSuccessToast(`Successfully approved and published "${editTitle}" to the live catalog!`);
      setTimeout(() => setSuccessToast(null), 4000);
      setInspectModalOpen(false);
      if (onGameApproved) onGameApproved();
    } catch (err: any) {
      setActionError(err?.message || "Failed to approve submission.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedSubmission) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      await rejectSubmission(selectedSubmission.id, rejectFeedback);
      setSuccessToast(`Submission "${selectedSubmission.title}" marked as rejected.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setRejectModalOpen(false);
    } catch (err: any) {
      setActionError(err?.message || "Failed to reject submission.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter and search
  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      s.title.toLowerCase().includes(query) ||
      s.userDisplayName.toLowerCase().includes(query) ||
      s.userEmail.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-amber-300 hover:bg-slate-950"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              statusFilter === "approved"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-emerald-300 hover:bg-slate-950"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              statusFilter === "rejected"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-rose-300 hover:bg-slate-950"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-950"
            }`}
          >
            All ({submissions.length})
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search submitter or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Submissions Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No submissions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? "No submissions matched your search query."
              : `There are currently no submissions with "${statusFilter}" status.`}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Submitter</th>
                  <th className="py-3 px-4">Game Details</th>
                  <th className="py-3 px-4">Category & Mode</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredSubmissions.map((sub) => {
                  const badgeStyle = getCategoryBadgeStyle(sub.categoryType, categories);
                  const categoryLabel = getCategoryTypeLabel(sub.categoryType, categories);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Submitter Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {sub.userDisplayName || "Anonymous Player"}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {sub.userEmail || "No email provided"}
                          </span>
                        </div>
                      </td>

                      {/* Game Title & Outbound Link */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 mt-0.5">
                            {sub.iconUrl ? (
                              <img
                                src={sub.iconUrl}
                                alt={sub.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80";
                                }}
                              />
                            ) : (
                              <Gamepad2 className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white truncate block">
                              {sub.title}
                            </span>
                            <a
                              href={sub.gameUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline truncate"
                            >
                              <span>{sub.gameUrl.replace(/^https?:\/\//, "")}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Category & Daily Flag */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                          >
                            {categoryLabel}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {sub.isDaily ? "⚡ Daily" : "🎮 Casual"}
                          </span>
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sub.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>Pending</span>
                          </span>
                        )}
                        {sub.status === "approved" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        )}
                        {sub.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openInspectModal(sub)}
                            className="text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            <span>Inspect & Edit</span>
                          </Button>

                          {sub.status === "pending" && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openRejectModal(sub)}
                              className="text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Reject</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= INSPECT, EDIT & APPROVE MODAL ================= */}
      {selectedSubmission && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          maxWidth="4xl"
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Inspect & Review Submission: "{selectedSubmission.title}"
                </h3>
                <p className="text-xs text-slate-400">
                  Submitted by {selectedSubmission.userDisplayName} ({selectedSubmission.userEmail}) on{" "}
                  {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-6 pt-2 max-h-[75vh] overflow-y-auto pr-1">
            {/* Top Submitter Overview Banner */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Submitter</span>
                <span className="font-bold text-white">{selectedSubmission.userDisplayName}</span>
                <span className="text-slate-400 block font-mono text-[11px] truncate">
                  {selectedSubmission.userEmail}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Submitted At</span>
                <span className="text-slate-300">
                  {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Live URL Test</span>
                <a
                  href={selectedSubmission.gameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold hover:underline"
                >
                  <span>Open Game Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Metadata Inputs */}
              <div className="lg:col-span-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Game Metadata & Direct Links
                </h4>

                <Input
                  id="inspect-title"
                  label="Game Title *"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />

                <Input
                  id="inspect-url"
                  label="Official Game URL *"
                  type="url"
                  value={editGameUrl}
                  onChange={(e) => setEditGameUrl(e.target.value)}
                  required
                />

                <Input
                  id="inspect-icon"
                  label="Icon / Thumbnail URL"
                  type="url"
                  value={editIconUrl}
                  onChange={(e) => setEditIconUrl(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Description & Summary
                  </label>
                  <textarea
                    id="inspect-description"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 outline-none resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Admin Feedback / Review Notes to Player
                  </label>
                  <textarea
                    id="inspect-admin-feedback"
                    rows={2}
                    value={adminFeedback}
                    onChange={(e) => setAdminFeedback(e.target.value)}
                    placeholder="Optional message or praise visible to the submitter..."
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 outline-none resize-none font-sans placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Right Column: Classification & Rules */}
              <div className="lg:col-span-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Classification & Rules Configuration
                </h4>

                {/* Daily vs Casual */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditIsDaily(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      editIsDaily
                        ? "bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/40"
                        : "bg-slate-950/60 border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        Daily Challenge
                      </span>
                      {editIsDaily && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                    </div>
                    <p className="text-[10px] text-slate-400">Tracked in daily diary & streaks</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsDaily(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !editIsDaily
                        ? "bg-indigo-500/15 border-indigo-500/60 ring-1 ring-indigo-500/40"
                        : "bg-slate-950/60 border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
                        Casual / Practice
                      </span>
                      {!editIsDaily && <Check className="w-3.5 h-3.5 text-indigo-400 stroke-[3]" />}
                    </div>
                    <p className="text-[10px] text-slate-400">Open practice, unlogged</p>
                  </button>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category Type
                  </label>
                  <select
                    id="inspect-category-select"
                    value={editCategoryType}
                    onChange={(e) => setEditCategoryType(e.target.value as GameCategoryType)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  >
                    {((categories && categories.length > 0)
                      ? categories.map((c) => c.id as GameCategoryType)
                      : (Object.keys(CATEGORY_DEFINITIONS) as GameCategoryType[])
                    ).map((catKey) => {
                      const data = getEffectiveCategoryData(catKey);
                      return (
                        <option key={catKey} value={catKey}>
                          {data.label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Dynamic Config Controls */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Category Parameters ({getCategoryTypeLabel(editCategoryType, categories)})
                  </span>

                  {editCategoryType === "classic_single" && (
                    <Input
                      id="inspect-config-max-attempts"
                      label="Max Attempts Allowed"
                      type="number"
                      min={1}
                      max={30}
                      value={editMaxAttempts}
                      onChange={(e) => setEditMaxAttempts(Number(e.target.value))}
                    />
                  )}

                  {editCategoryType === "multi_board" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="inspect-config-total-boards"
                        label="Total Boards"
                        type="number"
                        min={2}
                        max={32}
                        value={editTotalBoards}
                        onChange={(e) => setEditTotalBoards(Number(e.target.value))}
                      />
                      <Input
                        id="inspect-config-multi-attempts"
                        label="Max Attempts"
                        type="number"
                        min={1}
                        max={40}
                        value={editMaxAttempts}
                        onChange={(e) => setEditMaxAttempts(Number(e.target.value))}
                      />
                    </div>
                  )}

                  {editCategoryType === "unlimited_steps" && (
                    <Input
                      id="inspect-config-step-metric"
                      label="Step Metric Label"
                      value={editStepMetricLabel}
                      onChange={(e) => setEditStepMetricLabel(e.target.value)}
                    />
                  )}

                  {editCategoryType === "grouping_deduction" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="inspect-config-total-groups"
                        label="Total Groups"
                        type="number"
                        min={2}
                        max={8}
                        value={editTotalGroups}
                        onChange={(e) => setEditTotalGroups(Number(e.target.value))}
                      />
                      <Input
                        id="inspect-config-max-mistakes"
                        label="Max Mistakes"
                        type="number"
                        min={1}
                        max={10}
                        value={editMaxMistakes}
                        onChange={(e) => setEditMaxMistakes(Number(e.target.value))}
                      />
                    </div>
                  )}

                  {editCategoryType === "high_score_timed" && (
                    <Input
                      id="inspect-config-score-type"
                      label="Score Unit / Type"
                      value={editScoreType}
                      onChange={(e) => setEditScoreType(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  setInspectModalOpen(false);
                  openRejectModal(selectedSubmission);
                }}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                <span>Reject Submission</span>
              </Button>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isProcessing}
                  onClick={handleApprove}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Approve & Publish Live</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= REJECT SUBMISSION MODAL ================= */}
      {selectedSubmission && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          maxWidth="md"
          title={
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">
                Reject Submission "{selectedSubmission.title}"
              </h3>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-300">
              Please provide feedback for <span className="font-semibold text-white">{selectedSubmission.userDisplayName}</span> explaining why this game cannot be added to WordTrack at this time.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Feedback Message to Submitter *
              </label>
              <textarea
                id="reject-feedback-textarea"
                rows={4}
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Reason for rejection (e.g. Broken link, non-word game, duplicate title)..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-slate-100 outline-none resize-none font-sans"
              />
            </div>

            {actionError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">
                {actionError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isProcessing}
                onClick={handleRejectConfirm}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
