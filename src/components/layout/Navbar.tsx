import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Compass,
  Calendar,
  Flame,
  Shield,
  LogOut,
  Home,
  Send,
} from "lucide-react";
import { WordTrackLogo } from "../ui/WordTrackLogo";

export type NavTab = "dashboard" | "browse" | "submissions" | "diary" | "admin";

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  streakCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  streakCount = 0,
}) => {
  const { user, userProfile, isAdmin, logout, openAuthModal } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        {/* Fluid Edge-to-Edge Container */}
        <div className="w-full px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo (Anchored Left) */}
          <div
            id="brand-logo"
            onClick={() => handleNavClick("dashboard")}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <WordTrackLogo className="group-hover:scale-105 transition-transform" size={36} />
            <div>
              <span className="font-black text-xl text-white tracking-tight">
                WordTrack<span className="text-emerald-400">.</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 p-1.5 rounded-2xl backdrop-blur-md">
            <button
              id="nav-tab-dashboard"
              onClick={() => handleNavClick("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === "dashboard"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              id="nav-tab-browse"
              onClick={() => handleNavClick("browse")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === "browse"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Games</span>
            </button>

            <button
              id="nav-tab-submissions"
              onClick={() => handleNavClick("submissions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === "submissions"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Game</span>
            </button>

            <button
              id="nav-tab-diary"
              onClick={() => handleNavClick("diary")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === "diary"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Diary & Stats</span>
            </button>

            {isAdmin && (
              <button
                id="nav-tab-admin"
                onClick={() => handleNavClick("admin")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === "admin"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-950/50"
                    : "text-purple-400 hover:text-white hover:bg-purple-950/40 border border-purple-500/20"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Section: Streak & User Auth */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Daily Streak Counter Pill */}
            <div
              id="streak-pill"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black shadow-sm shrink-0"
              title="Current Consecutive Daily Play Streak"
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
              <span className="whitespace-nowrap">{streakCount} {streakCount === 1 ? "DAY" : "DAYS"}</span>
            </div>

            {/* User Auth Info / Dropdown */}
            {user ? (
              <div className="relative shrink-0">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1 sm:p-1.5 sm:pr-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-left backdrop-blur-md shrink-0"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="shrink-0 w-8 h-8 rounded-xl object-cover ring-1 ring-emerald-500/50"
                    />
                  ) : (
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shadow-sm overflow-hidden">
                      {(user.displayName || user.email || "P").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-slate-200 leading-tight">
                      {userProfile?.displayName || user.displayName || user.email?.split("@")[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {isAdmin ? "Admin" : "Player"}
                    </div>
                  </div>
                </button>

                {userMenuOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3.5 py-2.5 border-b border-slate-800/80 mb-1">
                      <p className="text-xs font-bold text-white truncate">
                        {userProfile?.displayName || user.displayName || "Player"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-flex mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Admin Account
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        handleNavClick("submissions");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                    >
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>My Game Submissions</span>
                    </button>

                    <button
                      onClick={() => {
                        handleNavClick("diary");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                    >
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>My Performance Journal</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          handleNavClick("admin");
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-950/40 rounded-xl transition-colors text-left"
                      >
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span>Manage Catalog & Games</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      id="logout-btn"
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center shrink-0">
                <button
                  id="header-signin-btn"
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Header spacer to prevent fixed header from overlapping main content */}
      <div className="h-20 w-full shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Native App-Style Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 w-full z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex md:hidden items-center justify-around shadow-2xl pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        {/* Home */}
        <button
          id="mobile-nav-tab-dashboard"
          onClick={() => handleNavClick("dashboard")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer select-none ${
            currentTab === "dashboard"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight leading-none mt-1">Home</span>
        </button>

        {/* Browse */}
        <button
          id="mobile-nav-tab-browse"
          onClick={() => handleNavClick("browse")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer select-none ${
            currentTab === "browse"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] tracking-tight leading-none mt-1">Browse</span>
        </button>

        {/* Submit Game */}
        <button
          id="mobile-nav-tab-submissions"
          onClick={() => handleNavClick("submissions")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer select-none ${
            currentTab === "submissions"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px] tracking-tight leading-none mt-1">Submit</span>
        </button>

        {/* Diary & Stats */}
        <button
          id="mobile-nav-tab-diary"
          onClick={() => handleNavClick("diary")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer select-none ${
            currentTab === "diary"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] tracking-tight leading-none mt-1">Diary</span>
        </button>

        {/* Admin (Only if Admin) */}
        {isAdmin && (
          <button
            id="mobile-nav-tab-admin"
            onClick={() => handleNavClick("admin")}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer select-none ${
              currentTab === "admin"
                ? "text-purple-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] tracking-tight leading-none mt-1">Admin</span>
          </button>
        )}
      </nav>
    </>
  );
};
