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
  at: number; // quando o status mudou pela última vez
}

type Store = Record<string, WatchEntry>;

const isStatus = (s: unknown): s is WatchStatus => WATCH_STATUSES.some((w) => w.value === s);

function parse(raw: unknown): Store {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Store = {};
  for (const [id, e] of Object.entries(raw as Record<string, WatchEntry>)) {
    if (e && isStatus(e.status) && e.anime && typeof e.anime.mal_id === "number") out[id] = e;
  }
  return out;
}

export function useWatchlist() {
  const [store, update] = usePersisted(WATCHLIST_KEY, parse);

  // Mais recentes primeiro.
  const entries = useMemo(() => Object.values(store).sort((a, b) => b.at - a.at), [store]);

  const statusOf = useCallback((id: number): WatchStatus | null => store[String(id)]?.status ?? null, [store]);

  /** status = null tira o anime da lista. */
  const setStatus = useCallback(
    (anime: Anime, status: WatchStatus | null) =>
      update((prev) => {
        const next = { ...prev };
        if (status === null) delete next[String(anime.mal_id)];
        else next[String(anime.mal_id)] = { anime, status, at: Date.now() };
        return next;
      }),
    [update]
  );

  return { entries, statusOf, setStatus };
}
