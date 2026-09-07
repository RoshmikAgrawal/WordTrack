import React, { useState, useEffect, useMemo } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar, NavTab } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { AuthModal } from "./components/auth/AuthModal";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Pages
import { DashboardPage } from "./pages/DashboardPage";
import { BrowsePage } from "./pages/BrowsePage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { DiaryPage } from "./pages/DiaryPage";
import { AdminPage } from "./pages/AdminPage";

// Services & Types
import { Game, GameLog, CategoryItem } from "./types";
import { getActiveGames, subscribeToGames } from "./services/games.service";
import { getAllCategories, DEFAULT_CATEGORIES, subscribeToCategories } from "./services/categories.service";
import { subscribeToUserLifetimeLogs, computeLifetimeStats } from "./services/logs.service";
import { getLocalDateISO } from "./lib/utils";
import { testConnection } from "./lib/firebase";

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [loadingGames, setLoadingGames] = useState<boolean>(true);

  // Lifetime Logs State for Diary & Global Streaks
  const [userLifetimeLogs, setUserLifetimeLogs] = useState<GameLog[]>([]);

  // Fetch and refresh dynamic categories
  const refreshCategories = async () => {
    try {
      const fetched = await getAllCategories();
      setCategories(fetched);
    } catch (err) {
      console.warn("Could not fetch categories:", err);
    }
  };

  // Refresh active games
  const refreshGames = async () => {
    try {
      const refreshed = await getActiveGames();
      setAllGames(refreshed);
    } catch (err) {
      console.warn("Could not fetch games:", err);
    }
  };

  // Initialize Firebase connection and subscribe to games catalog & categories
  useEffect(() => {
    testConnection();
    refreshCategories();

    const unsubCategories = subscribeToCategories((cats) => {
      setCategories(cats);
    });

    const unsubGames = subscribeToGames(
      (games) => {
        setAllGames(games);
        setLoadingGames(false);
      },
      () => {
        setLoadingGames(false);
      }
    );

    return () => {
      unsubCategories();
      unsubGames();
    };
  }, []);

  // Subscribe to user's lifetime logs for Diary & Streaks
  useEffect(() => {
    if (!user) {
      // Local fallback for guest user from localStorage
      try {
        const local = localStorage.getItem(`wordtrack_logs_${getLocalDateISO()}`);
        if (local) {
          setUserLifetimeLogs(JSON.parse(local));
        } else {
          setUserLifetimeLogs([]);
        }
      } catch {
        setUserLifetimeLogs([]);
      }
      return;
    }

    const unsubscribe = subscribeToUserLifetimeLogs(
      user.uid,
      (logs) => {
        setUserLifetimeLogs(logs);
      },
      (err) => {
        console.warn("Could not fetch lifetime logs:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Aggregate lifetime statistics
  const lifetimeStats = useMemo(() => {
    return computeLifetimeStats(userLifetimeLogs);
  }, [userLifetimeLogs]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 w-full max-w-full overflow-x-hidden">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        streakCount={lifetimeStats.currentStreak}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full max-w-full overflow-x-hidden mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-10">
        {/* 1. Home / Daily Tracker Tab */}
        {currentTab === "dashboard" && (
          <DashboardPage
            games={allGames}
            categories={categories}
            streakCount={lifetimeStats.currentStreak}
            onNavigateToBrowse={() => setCurrentTab("browse")}
          />
        )}

        {/* 2. Browse Catalog Tab */}
        {currentTab === "browse" && (
          <BrowsePage games={allGames} categories={categories} />
        )}

        {/* 3. User Game Submissions & Suggestions Tab */}
        {currentTab === "submissions" && (
          <SubmissionsPage categories={categories} />
        )}

        {/* 4. Performance Diary & Stats Tab */}
        {currentTab === "diary" && (
          <DiaryPage
            allGames={allGames}
            userLifetimeLogs={userLifetimeLogs}
            lifetimeStats={lifetimeStats}
            categories={categories}
          />
        )}

        {/* 5. Admin Management Tab */}
        {currentTab === "admin" && (
          <ProtectedRoute requireAdmin>
            <AdminPage
              allGames={allGames}
              categories={categories}
              onRefreshGames={refreshGames}
              onRefreshCategories={refreshCategories}
              onGamesUpdated={(updatedGames) => {
                setAllGames(updatedGames);
              }}
            />
          </ProtectedRoute>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
