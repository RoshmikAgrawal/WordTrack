import React, { useState, useEffect } from "react";
import { GameSubmission, SubmissionStatus, CategoryItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { subscribeToUserSubmissions } from "../services/submissions.service";
import { GameSubmissionModal } from "../components/submissions/GameSubmissionModal";
import { Button, Card, Badge } from "../components/ui";
import {
  Send,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  Gamepad2,
  Zap,
  Sparkles,
  AlertCircle,
  Calendar,
  Lock,
} from "lucide-react";
import { getCategoryBadgeStyle, getCategoryTypeLabel } from "../lib/utils";

interface SubmissionsPageProps {
  categories?: CategoryItem[];
}

export const SubmissionsPage: React.FC<SubmissionsPageProps> = ({ categories = [] }) => {
  const { user, signInWithGoogle } = useAuth();
  const [submissions, setSubmissions] = useState<GameSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Subscribe to real-time user submissions
  useEffect(() => {
    if (!user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserSubmissions(
      user.uid,
      (subs) => {
        setSubmissions(subs);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const pendingCount = pendingSubmissions.length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;
  const isQuotaReached = pendingCount >= 3;

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter === "all") return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-2">
      {/* Top Header & Submission Action Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Suggest & Track Word Games
            </h1>
          </div>
          <p id="submissions-header-description" className="text-sm text-slate-400 leading-relaxed">
            Have a word puzzle that you like that isn't on WordTrack yet? Submit it for review. Once approved, it will be added to the public catalog to log.
          </p>
        </div>

        {/* Quota & Submit CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {user && (
            <div
              className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 text-xs font-semibold ${
                isQuotaReached
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : pendingCount === 2
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-slate-950/80 border-slate-800 text-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                Pending Quota:{" "}
                <span className={`font-bold ${isQuotaReached ? "text-rose-400" : "text-emerald-400"}`}>
                  {pendingCount} / 3
                </span>{" "}
                Used
              </span>
            </div>
          )}

          {user ? (
            <Button
              id="open-submit-game-modal-btn"
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              disabled={isQuotaReached}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>Submit New Game</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => signInWithGoogle()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold w-full sm:w-auto"
            >
              <Lock className="w-4 h-4 mr-1.5" />
              <span>Sign in to Submit</span>
            </Button>
          )}
        </div>
      </div>

      {/* Guest Authentication Banner */}
      {!user && (
        <Card className="border-indigo-500/30 bg-indigo-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sign In Required for Submissions</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Sign in to submit your favorite word puzzles, receive administrator feedback, and view real-time approval status.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => signInWithGoogle()} className="shrink-0 text-xs">
            Sign In with Google
          </Button>
        </Card>
      )}

      {/* Main Content Area */}
      {user && (
        <div className="space-y-6">
          {/* Submissions Filter Tabs Container */}
          <div className="w-full max-w-full overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 min-w-max">
              {/* All Submissions Button */}
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                All Submissions ({submissions.length})
              </button>

              {/* Pending Button */}
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "pending"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Pending ({pendingCount})</span>
              </button>

              {/* Approved Button */}
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "approved"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Approved ({approvedCount})</span>
              </button>

              {/* Rejected Button */}
              <button
                type="button"
                onClick={() => setStatusFilter("rejected")}
                className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "rejected"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Rejected ({rejectedCount})</span>
              </button>
            </div>
          </div>

          {/* Submissions Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-52 bg-slate-900/60 rounded-3xl animate-pulse border border-slate-800" />
              ))}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
                <Send className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">No game submissions found</h3>
                <p className="text-xs text-slate-400">
                  {statusFilter === "all"
                    ? "You haven't submitted any word games yet. Have a puzzle you'd love to see on WordTrack?"
                    : `You have no submissions with "${statusFilter}" status.`}
                </p>
              </div>
              {!isQuotaReached && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-emerald-500 text-slate-950 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Submit a Game
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubmissions.map((sub) => {
                const badgeStyle = getCategoryBadgeStyle(sub.categoryType, categories);
                const categoryLabel = getCategoryTypeLabel(sub.categoryType, categories);

                return (
                  <Card
                    key={sub.id}
                    className="p-5 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden"
                  >
                    {/* Top Status & Flags */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        {/* Status Badge */}
                        {sub.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {sub.status === "approved" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved & Live</span>
                          </span>
                        )}
                        {sub.status === "rejected" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Not Accepted</span>
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Header with Icon & Title */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
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
                            <Gamepad2 className="w-6 h-6 text-slate-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                            {sub.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                            >
                              {categoryLabel}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {sub.isDaily ? "⚡ Daily" : "🎮 Casual"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {sub.description || "No description provided."}
                      </p>

                      {/* Admin Feedback Box if present */}
                      {sub.adminFeedback && (
                        <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Admin Review Note:</span>
                          </div>
                          <p className="text-xs text-slate-400 italic">
                            "{sub.adminFeedback}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Link Action */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <a
                        href={sub.gameUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                      >
                        <span>Visit Game Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {sub.status === "approved" && (
                        <span className="text-[11px] text-emerald-400 font-medium">
                          Live in Catalog
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submission Modal */}
      <GameSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        pendingCount={pendingCount}
        onSuccess={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
