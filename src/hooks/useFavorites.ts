import { useCallback } from "react";
import { FAVORITES_KEY } from "../profiles";
import type { Anime } from "../types";
import { usePersisted } from "./usePersisted";

// Dado corrompido (não é lista) não pode derrubar o app.
const parse = (raw: unknown): Anime[] =>
  Array.isArray(raw) ? raw.filter((a) => a && typeof a.mal_id === "number") : [];

export function useFavorites() {
  const [favorites, update] = usePersisted(FAVORITES_KEY, parse);

  const isFavorite = useCallback((id: number) => favorites.some((a) => a.mal_id === id), [favorites]);

  const toggle = useCallback(
    (anime: Anime) =>
      update((prev) =>
        prev.some((a) => a.mal_id === anime.mal_id)
          ? prev.filter((a) => a.mal_id !== anime.mal_id)
          : [anime, ...prev]
      ),
    [update]
  );

  return { favorites, isFavorite, toggle };
}
