import React from "react";
import { StatsSummary } from "../../types";
import { Trophy, Flame, Target, CheckCircle2, TrendingUp } from "lucide-react";

interface StatsDashboardProps {
  stats: StatsSummary;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* 4 Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Played Bento Box */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-6 backdrop-blur-xl flex flex-col justify-between shadow-xl shadow-black/30 group hover:border-slate-700/80 transition-all">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Played
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {stats.totalPlayed}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Daily games registered</p>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-3 opacity-5 pointer-events-none">
            <Target className="w-24 h-24 text-white" />
          </div>
        </div>

        {/* Win Rate Bento Box */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-6 backdrop-blur-xl flex flex-col justify-between shadow-xl shadow-black/30 group hover:border-slate-700/80 transition-all">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Win Rate
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {stats.winRate}
                <span className="text-emerald-400 text-3xl font-sans">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                {stats.totalSolved} solved of {stats.totalPlayed}
              </p>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-3 opacity-5 pointer-events-none">
            <Trophy className="w-24 h-24 text-white" />
          </div>
        </div>

        {/* Current Streak Bento Box */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-6 backdrop-blur-xl flex flex-col justify-between shadow-xl shadow-black/30 group hover:border-slate-700/80 transition-all">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Streak
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {stats.currentStreak}{" "}
                <span className="text-lg font-bold text-amber-400 font-sans">DAYS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Unbroken daily record</p>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-3 opacity-5 pointer-events-none">
            <Flame className="w-24 h-24 text-white" />
          </div>
        </div>

        {/* Max Streak Bento Box */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-6 backdrop-blur-xl flex flex-col justify-between shadow-xl shadow-black/30 group hover:border-slate-700/80 transition-all">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Best Streak
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {stats.maxStreak}{" "}
                <span className="text-lg font-bold text-indigo-400 font-sans">DAYS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">All-time peak performance</p>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-3 opacity-5 pointer-events-none">
            <TrendingUp className="w-24 h-24 text-white" />
          </div>
        </div>
      </div>

      {/* Per-Game Performance Breakdown Bento Card */}
      <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-6 sm:p-7 backdrop-blur-xl shadow-xl shadow-black/30 space-y-5">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Game Performance
                </h3>
                <p className="text-[11px] text-slate-400">Detailed per-puzzle breakdown</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {stats.favoriteGamePerformance.length} Games
            </span>
          </div>

          {stats.favoriteGamePerformance.length > 0 ? (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 font-semibold">Game</th>
                    <th className="py-2.5 font-semibold text-center">Played</th>
                    <th className="py-2.5 font-semibold text-center">Win Rate</th>
                    <th className="py-2.5 font-semibold text-right">Avg Tries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.favoriteGamePerformance.map((item) => (
                    <tr key={item.gameId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-bold text-white">{item.gameTitle}</td>
                      <td className="py-3 font-mono text-center text-slate-300">{item.played}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md border ${
                            item.winRate >= 80
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : item.winRate >= 50
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {item.winRate}%
                        </span>
                      </td>
                      <td className="py-3 font-mono font-semibold text-right text-slate-300">
                        {item.averageAttempts > 0 ? item.averageAttempts : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <p>Log word games across multiple sessions to populate individual game stats.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
