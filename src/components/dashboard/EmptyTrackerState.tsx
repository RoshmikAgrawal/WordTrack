import React from "react";
import { Button } from "../ui";
import { Sparkles, Compass, Trophy, Star } from "lucide-react";

interface EmptyTrackerStateProps {
  type: "no_favorites" | "all_completed";
  onBrowseClick: () => void;
}

export const EmptyTrackerState: React.FC<EmptyTrackerStateProps> = ({
  type,
  onBrowseClick,
}) => {
  if (type === "all_completed") {
    return (
      <div className="rounded-3xl bg-slate-900/40 border border-emerald-500/30 p-8 sm:p-12 text-center shadow-xl shadow-black/30 backdrop-blur-xl space-y-4 max-w-xl mx-auto my-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
          <Trophy className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white">Daily Board Complete!</h3>
          <p className="text-sm text-slate-400">
            You have solved or logged all of your starred games for today. Check your Performance Diary to see streaks and lifetime metrics!
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={onBrowseClick} className="rounded-xl border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Discover More Word Games</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-8 sm:p-12 text-center shadow-xl shadow-black/30 backdrop-blur-xl space-y-5 max-w-xl mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
        <Star className="w-7 h-7 fill-emerald-500/20" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">Build Your Daily Word Routine</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          You haven't starred any word games yet. Head over to our catalog of online word puzzles (Wordle, Octordle, Connections, Contexto & more) and click the star icon to pin them here.
        </p>
      </div>
      <div className="pt-2">
        <Button id="empty-state-browse-btn" variant="primary" size="md" onClick={onBrowseClick} className="rounded-xl font-bold">
          <Compass className="w-4 h-4" />
          <span>Browse & Star Games</span>
        </Button>
      </div>
    </div>
  );
};
