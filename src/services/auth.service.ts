import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile } from "../types";

const ADMIN_EMAILS = ["roshmikagrawal@gmail.com"];

/**
 * Ensures a user document exists in Firestore and returns the UserProfile
 */
export async function syncUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, "users", firebaseUser.uid);
  try {
    const snap = await getDoc(userRef);
    const isAdmin =
      (firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase())) || false;

    if (!snap.exists()) {
      const defaultFavorites: string[] = [];
      const newProfile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Word Player",
        photoURL: firebaseUser.photoURL || null,
        role: isAdmin ? "admin" : "user",
        favoriteGameIds: defaultFavorites,
      };

      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        ...newProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      const data = snap.data() as UserProfile;
      // Auto upgrade if admin email matches and not yet admin
      if (isAdmin && data.role !== "admin") {
        await updateDoc(userRef, {
          role: "admin",
          updatedAt: serverTimestamp(),
        });
        data.role = "admin";
      }
      return data;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  return await syncUserProfile(result.user);
}

/**
 * Sign up with Email and Password
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateAuthProfile(cred.user, { displayName });
  }
  return await syncUserProfile(cred.user);
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return await syncUserProfile(cred.user);
}

/**
 * Log out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to realtime changes of the current user's profile
 */
export function subscribeToUserProfile(
  uid: string,
  onProfile: (profile: UserProfile | null) => void,
  onError?: (err: any) => void
) {
  const userRef = doc(db, "users", uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        onProfile(snap.data() as UserProfile);
      } else {
        onProfile(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  );
}

/**
 * Toggle favorite game in user profile
 */
export async function toggleFavoriteGame(
  userId: string,
  gameId: string,
  isFavorite: boolean
): Promise<void> {
  const userRef = doc(db, "users", userId);
  try {
    await setDoc(
      userRef,
      {
        favoriteGameIds: isFavorite ? arrayRemove(gameId) : arrayUnion(gameId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

/**
 * Overwrites the user's favoriteGameIds array in Firestore without toggling empty items
 */
export async function syncUserFavorites(userId: string, favoriteGameIds: string[]): Promise<void> {
  try {
    const cleanFavorites = Array.from(new Set(favoriteGameIds.filter((id) => Boolean(id && id.trim()))));
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        favoriteGameIds: cleanFavorites,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

/**
 * Set full favorite games list in user profile
 */
export async function setFavoriteGameIds(
  userId: string,
  favoriteGameIds: string[]
): Promise<void> {
  const userRef = doc(db, "users", userId);
  try {
    await setDoc(
      userRef,
      {
        favoriteGameIds,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}
