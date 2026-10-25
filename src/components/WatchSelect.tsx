import { useWatchlist, WATCH_STATUSES } from "../hooks/useWatchlist";
import type { WatchStatus } from "../hooks/useWatchlist";
import type { Anime } from "../types";

export default function WatchSelect({ anime }: { anime: Anime }) {
  const { statusOf, setStatus } = useWatchlist();
  return (
    <label className="watchselect">
      <span>Minha lista</span>
      <select
        value={statusOf(anime.mal_id) ?? ""}
        onChange={(e) => setStatus(anime, (e.target.value || null) as WatchStatus | null)}
      >
        <option value="">Fora da lista</option>
        {WATCH_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </label>
  );
}
