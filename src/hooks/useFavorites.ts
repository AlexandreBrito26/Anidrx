import { useCallback, useEffect, useState } from "react";
import type { Anime } from "../types";

const KEY = "anidrx:favorites";

function load(): Anime[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    // Dado corrompido (não é lista) não pode derrubar o app.
    return Array.isArray(saved) ? saved.filter((a) => a && typeof a.mal_id === "number") : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Anime[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(favorites));
    } catch {
      /* armazenamento indisponível */
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (id: number) => favorites.some((a) => a.mal_id === id),
    [favorites]
  );

  const toggle = useCallback((anime: Anime) => {
    setFavorites((prev) =>
      prev.some((a) => a.mal_id === anime.mal_id)
        ? prev.filter((a) => a.mal_id !== anime.mal_id)
        : [anime, ...prev]
    );
  }, []);

  return { favorites, isFavorite, toggle };
}
