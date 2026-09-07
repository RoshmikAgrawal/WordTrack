import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui";
import { ShieldAlert, LogIn, Lock } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAdmin, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-xl space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <LogIn className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Sign In Required</h2>
          <p className="text-sm text-slate-400">
            Please log in or create an account to access this page and track your daily word game performance.
          </p>
        </div>
        <Button onClick={() => openAuthModal("login")} className="w-full">
          Sign In / Register
        </Button>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-rose-500/20 rounded-2xl text-center shadow-xl space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Admin Access Restricted</h2>
          <p className="text-sm text-slate-400">
            This area is strictly restricted to administrator accounts.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
