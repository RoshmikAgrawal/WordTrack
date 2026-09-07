import React, { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useFavorites() {
  const { favoriteGameIds, toggleFavorite, isGameFavorited } = useAuth();

  const handleToggle = useCallback(
    async (gameId: string, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      try {
        await toggleFavorite(gameId);
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
      }
    },
    [toggleFavorite]
  );

  return {
    favoriteGameIds,
    isFavorited: isGameFavorited,
    toggleFavorite: handleToggle,
  };
}
