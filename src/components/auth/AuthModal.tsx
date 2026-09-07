import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button, Input } from "../ui";
import { useAuth } from "../../context/AuthContext";
import { Sparkles, Mail, Lock, User, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { WordTrackLogo } from "../ui/WordTrackLogo";

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    closeAuthModal,
    authModalTab,
    authModalPrompt,
    openAuthModal,
    signIn,
    signUp,
    signInWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError(null);
    setIsDomainError(false);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsDomainError(false);
    setLoading(true);
    try {
      await signInWithGoogle();
      handleClose();
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      if (err?.code === "auth/unauthorized-domain") {
        setIsDomainError(true);
        setError(
          `Google OAuth domain is not authorized in Firebase settings for this preview URL. Please sign in with Email & Password below.`
        );
      } else if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in window was closed before completing.");
      } else if (err?.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups or use Email & Password.");
      } else {
        setError(err?.message || "Google sign in failed. Please use Email & Password below.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsDomainError(false);
    setSuccessMsg(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (authModalTab === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName || email.split("@")[0]);
      }
      handleClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Authentication failed. Please verify your credentials.";
      if (err?.code === "auth/email-already-in-use") {
        message = "This email is already in use. Please sign in instead.";
      } else if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        message = "Invalid email or password. If you don't have an account yet, click 'Register' above.";
      } else if (err?.code === "auth/user-not-found") {
        message = "No account found with this email. Click 'Register' above to create one.";
      } else if (err?.code === "auth/weak-password") {
        message = "The password is too weak. Please use at least 6 characters.";
      } else if (err?.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2.5">
          <WordTrackLogo size={32} />
          <span className="text-xl font-bold text-white">
            {authModalTab === "login" ? "Sign In to WordTrack" : "Create WordTrack Account"}
          </span>
        </div>
      }
      description={
        authModalTab === "login"
          ? "Sync your daily word game scores, track streaks, and view lifetime analytics."
          : "Start journaling your daily Wordle, Connections, and word game performances."
      }
    >
      <div className="space-y-4 pt-2">
        {/* Custom contextual prompt if opened from a feature like Log Score */}
        {authModalPrompt && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                Account Required to Continue
              </h4>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                {authModalPrompt}
              </p>
            </div>
          </div>
        )}

        {/* Domain restriction notice if Google sign-in was clicked on unlisted preview URL */}
        {isDomainError && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2 text-xs">
            <div className="flex items-start gap-2 text-amber-300 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>Firebase Preview Domain Restriction</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Google OAuth is restricted for this preview container domain in Firebase Auth settings. Please use Email & Password below to sign in or register immediately.
            </p>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-100 font-medium text-sm rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 border-t border-slate-800" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">
            Or with email
          </span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsDomainError(false);
              openAuthModal("login");
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authModalTab === "login"
                ? "bg-slate-800 text-emerald-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsDomainError(false);
              openAuthModal("register");
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authModalTab === "register"
                ? "bg-slate-800 text-emerald-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalTab === "register" && (
            <div>
              <Input
                id="auth-display-name"
                label="Player Name"
                type="text"
                placeholder="e.g. WordMaster Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <Input
              id="auth-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              id="auth-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && !isDomainError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <Button
            id="auth-submit-btn"
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={loading}
          >
            {authModalTab === "login" ? "Sign In to WordTrack" : "Create Free Account"}
          </Button>
        </form>

        <div className="text-center pt-1">
          <p className="text-xs text-slate-500">
            By continuing, your game stats and daily streaks are securely saved to your account.
          </p>
        </div>
      </div>
    </Modal>
  );
};
