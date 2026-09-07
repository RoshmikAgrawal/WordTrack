import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { UserProfile } from "../types";
import {
  syncUserProfile,
  signInWithGoogle as authSignInWithGoogle,
  registerWithEmail as authRegisterWithEmail,
  loginWithEmail as authLoginWithEmail,
  logoutUser as authLogoutUser,
  subscribeToUserProfile,
  toggleFavoriteGame,
  syncUserFavorites,
} from "../services/auth.service";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  favoriteGameIds: string[];
  isAdmin: boolean;
  loading: boolean;
  authModalOpen: boolean;
  authModalTab: "login" | "register";
  authModalPrompt: string | null;
  openAuthModal: (tab?: "login" | "register", prompt?: string, onComplete?: () => void) => void;
  closeAuthModal: () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (gameId: string) => Promise<void>;
  isGameFavorited: (gameId: string) => boolean;
}

const AUTH_STORAGE_KEY = "wordtrack_favorites";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [guestFavorites, setGuestFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [authModalPrompt, setAuthModalPrompt] = useState<string | null>(null);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Firestore profile is the sole source of truth for logged-in users; guests always get an empty list
  const activeFavorites = user && userProfile?.favoriteGameIds !== undefined
    ? userProfile.favoriteGameIds
    : guestFavorites;

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);

          if (profile) {
            // New or unconfigured profiles initialize with an empty list
            if (!Array.isArray(profile.favoriteGameIds)) {
              profile.favoriteGameIds = [];
              await syncUserFavorites(currentUser.uid, []);
            }
            setUserProfile(profile);

            try {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile.favoriteGameIds));
            } catch (e) {
              console.warn("Could not cache user favorites:", e);
            }
          }

          // Real-time listener for profile updates
          unsubscribeProfile = subscribeToUserProfile(
            currentUser.uid,
            (updatedProfile) => {
              if (updatedProfile) {
                setUserProfile(updatedProfile);
                if (Array.isArray(updatedProfile.favoriteGameIds)) {
                  try {
                    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedProfile.favoriteGameIds));
                  } catch (e) {
                    console.warn("Could not cache user favorites:", e);
                  }
                }
              }
            },
            (err) => {
              console.warn("User profile subscription notice:", err);
            }
          );
        } catch (err) {
          console.error("Error setting up user profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = undefined;
        }
        setUserProfile(null);
        setGuestFavorites([]);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem("wordtrack_guest_favorites");
        } catch (e) {
          console.warn("Could not clear local storage on guest state:", e);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const openAuthModal = (
    tab: "login" | "register" = "login",
    prompt?: string,
    onComplete?: () => void
  ) => {
    setAuthModalTab(tab);
    setAuthModalPrompt(prompt || null);
    setPendingCallback(onComplete ? () => onComplete : null);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthModalPrompt(null);
    setPendingCallback(null);
  };

  const handleAuthSuccess = (profile: UserProfile | null) => {
    setUserProfile(profile);
    setAuthModalOpen(false);
    setAuthModalPrompt(null);
    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      setTimeout(() => {
        try {
          cb();
        } catch (err) {
          console.error("Error running auth complete callback:", err);
        }
      }, 120);
    }
  };

  const signIn = async (email: string, pass: string) => {
    const profile = await authLoginWithEmail(email, pass);
    handleAuthSuccess(profile);
  };

  const signUp = async (email: string, pass: string, displayName: string) => {
    const profile = await authRegisterWithEmail(email, pass, displayName);
    handleAuthSuccess(profile);
  };

  const signInWithGoogle = async () => {
    const profile = await authSignInWithGoogle();
    handleAuthSuccess(profile);
  };

  const logout = async () => {
    try {
      await authLogoutUser();
    } catch (err) {
      console.error("Error during auth logout:", err);
    } finally {
      // Purge all stored favorite and session keys
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem("wordtrack_guest_favorites");
      } catch (e) {
        console.warn("Could not clear local storage on logout:", e);
      }

      setUser(null);
      setUserProfile(null);
      setGuestFavorites([]);
    }
  };

  const isGameFavorited = (gameId: string): boolean => {
    return activeFavorites.includes(gameId);
  };

  const toggleFavorite = async (gameId: string) => {
    // 1. Guard against guest interaction: Prompt sign-in
    if (!user) {
      openAuthModal(
        "login",
        "Sign in or create a free account to customize and track your favorite daily word games."
      );
      return;
    }

    // 2. Authenticated user toggle
    const isFav = activeFavorites.includes(gameId);
    const updatedFavs = isFav
      ? activeFavorites.filter((id) => id !== gameId)
      : [...activeFavorites, gameId];

    // Optimistic profile update
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        favoriteGameIds: updatedFavs,
      });
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedFavs));
    } catch (e) {
      console.warn("Could not save to local storage:", e);
    }

    try {
      await toggleFavoriteGame(user.uid, gameId, isFav);
    } catch (err) {
      console.error("Failed to sync favorite to Firebase:", err);
    }
  };

  const isAdmin = userProfile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        favoriteGameIds: activeFavorites,
        isAdmin,
        loading,
        authModalOpen,
        authModalTab,
        authModalPrompt,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        toggleFavorite,
        isGameFavorited,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
