import React from "react";
import { formatDisplayDate } from "../../lib/utils";
import { Progress, Button } from "../ui";
import { Calendar, Plus } from "lucide-react";

interface TrackerHeaderProps {
  todayDate: string;
  completedCount: number;
  totalFavorited: number;
  progressPercent: number;
  streakCount?: number;
  onBrowseClick: () => void;
}

export const TrackerHeader: React.FC<TrackerHeaderProps> = ({
  todayDate,
  completedCount,
  totalFavorited,
  progressPercent,
  onBrowseClick,
}) => {
  const isAllCompleted = totalFavorited > 0 && completedCount === totalFavorited;

  return (
    <div className="w-full">
      {/* Main Bento Spotlight Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between min-h-[180px] shadow-2xl shadow-black/40">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-10 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold py-1 px-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDisplayDate(todayDate)}</span>
            </div>

            <Button
              id="header-browse-more-btn"
              variant="outline"
              size="sm"
              onClick={onBrowseClick}
              className="rounded-xl border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customize Favorites</span>
            </Button>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Today's Word Game Hub<span className="text-emerald-400">.</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {isAllCompleted
                ? "Incredible focus! You have conquered every daily word puzzle in your journal today."
                : totalFavorited === 0
                ? "Customize your active daily games from our discovery catalog to start tracking."
                : `You've solved ${completedCount} of ${totalFavorited} daily challenge games so far.`}
            </p>
          </div>
        </div>

        {/* Progress Bar inside Bento card */}
        {totalFavorited > 0 && (
          <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Daily Quest Progress</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800/80 font-mono text-[11px] text-slate-300 font-semibold border border-slate-700/50">
                  {completedCount} / {totalFavorited} Done
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {progressPercent}%
              </span>
            </div>
            <Progress
              value={completedCount}
              max={totalFavorited}
              className="h-2.5 bg-slate-950/80 rounded-full"
              color={
                isAllCompleted
                  ? "bg-gradient-to-r from-emerald-400 to-teal-300 shadow-md shadow-emerald-500/40"
                  : "bg-emerald-500"
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
