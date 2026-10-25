import { useWatchlist } from "../hooks/useWatchlist";
import type { Anime } from "../types";

// Quantos episódios a pessoa já viu. Mexer aqui coloca o anime em "Assistindo" (ou "Concluído"
// ao chegar no último episódio) na Minha lista.
export default function EpisodeProgress({ anime }: { anime: Anime }) {
  const { progressOf, setProgress } = useWatchlist();
  const watched = progressOf(anime.mal_id);
  const total = anime.episodes && anime.episodes > 0 ? anime.episodes : null;

  return (
    <div className="epprogress" role="group" aria-label="Episódios assistidos">
      <span>Episódios vistos</span>
      <button
        className="btn btn--small"
        aria-label="Menos um episódio"
        disabled={watched === 0}
        onClick={() => setProgress(anime, watched - 1)}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={total ?? undefined}
        value={watched}
        aria-label="Quantidade de episódios vistos"
        onChange={(e) => setProgress(anime, Number(e.target.value))}
      />
      {total && <span>de {total}</span>}
      <button
        className="btn btn--small"
        aria-label="Mais um episódio"
        disabled={total !== null && watched >= total}
        onClick={() => setProgress(anime, watched + 1)}
      >
        +
      </button>
      {total && <progress value={watched} max={total} aria-hidden="true" />}
    </div>
  );
}
