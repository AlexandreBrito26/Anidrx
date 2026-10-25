import { useCallback, useMemo } from "react";
import { WATCHLIST_KEY } from "../profiles";
import type { Anime } from "../types";
import { usePersisted } from "./usePersisted";

export type WatchStatus = "planned" | "watching" | "completed";

export const WATCH_STATUSES: { value: WatchStatus; label: string }[] = [
  { value: "planned", label: "Quero ver" },
  { value: "watching", label: "Assistindo" },
  { value: "completed", label: "Concluído" },
];

export interface WatchEntry {
  anime: Anime;
  status: WatchStatus;
  at: number; // última vez que o status ou o progresso mudou
  progress?: number; // episódios já assistidos (ausente = nenhum)
}

type Store = Record<string, WatchEntry>;

const isStatus = (s: unknown): s is WatchStatus => WATCH_STATUSES.some((w) => w.value === s);

// Lixo vira "sem progresso"; listas salvas antes deste campo existir continuam válidas.
const cleanProgress = (n: unknown): number | undefined =>
  typeof n === "number" && Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined;

function parse(raw: unknown): Store {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Store = {};
  for (const [id, e] of Object.entries(raw as Record<string, WatchEntry>)) {
    if (e && isStatus(e.status) && e.anime && typeof e.anime.mal_id === "number") {
      const { progress, ...rest } = e;
      const clean = cleanProgress(progress);
      out[id] = clean ? { ...rest, progress: clean } : rest;
    }
  }
  return out;
}

export function useWatchlist() {
  const [store, update] = usePersisted(WATCHLIST_KEY, parse);

  // Mais recentes primeiro.
  const entries = useMemo(() => Object.values(store).sort((a, b) => b.at - a.at), [store]);

  const statusOf = useCallback((id: number): WatchStatus | null => store[String(id)]?.status ?? null, [store]);

  const progressOf = useCallback((id: number): number => store[String(id)]?.progress ?? 0, [store]);

  /** status = null tira o anime da lista. Concluir marca todos os episódios como vistos. */
  const setStatus = useCallback(
    (anime: Anime, status: WatchStatus | null) =>
      update((prev) => {
        const next = { ...prev };
        const id = String(anime.mal_id);
        if (status === null) {
          delete next[id];
          return next;
        }
        const progress = status === "completed" && anime.episodes ? anime.episodes : prev[id]?.progress;
        next[id] = { anime, status, at: Date.now(), ...(progress ? { progress } : {}) };
        return next;
      }),
    [update]
  );

  /**
   * Define quantos episódios foram vistos (limitado ao total, quando se sabe).
   * Ver algum episódio coloca o anime em "Assistindo"; ver todos, em "Concluído".
   */
  const setProgress = useCallback(
    (anime: Anime, count: number) =>
      update((prev) => {
        const id = String(anime.mal_id);
        const current = prev[id];
        const max = anime.episodes && anime.episodes > 0 ? anime.episodes : Infinity;
        const n = Math.min(Math.max(0, Math.floor(count) || 0), max);
        if (n === 0 && !current) return prev;

        let status: WatchStatus;
        if (n > 0) status = n >= max ? "completed" : "watching";
        else status = current && current.status !== "completed" ? current.status : "planned";

        return { ...prev, [id]: { anime, status, at: Date.now(), ...(n > 0 ? { progress: n } : {}) } };
      }),
    [update]
  );

  return { entries, statusOf, progressOf, setStatus, setProgress };
}
