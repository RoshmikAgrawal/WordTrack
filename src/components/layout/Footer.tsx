import React from "react";
import { ShieldCheck } from "lucide-react";
import { WordTrackLogo } from "../ui/WordTrackLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="hidden md:block w-full border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md mt-auto py-6 text-xs text-slate-400">
      <div className="w-full px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <WordTrackLogo size={26} />
          <span className="font-bold text-slate-200">
            WordTrack<span className="text-emerald-400">.</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">
            — Daily word puzzle performance journal.
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud Sync Active</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
