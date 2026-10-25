import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import ThemePicker from "../components/ThemePicker";
import ProfileMenu from "../components/ProfileMenu";
import AnimeCard from "../components/AnimeCard";
import AnimeModal from "../components/AnimeModal";
import { useFavorites } from "../hooks/useFavorites";
import { useProfiles } from "../hooks/useProfiles";
import { useWatchlist, WATCH_STATUSES } from "../hooks/useWatchlist";
import type { WatchStatus } from "../hooks/useWatchlist";
import type { Anime } from "../types";

export default function MyList() {
  const [tab, setTab] = useState<WatchStatus | "">("");
  const [selected, setSelected] = useState<Anime | null>(null);
  const { entries } = useWatchlist();
  const { isFavorite, toggle } = useFavorites();
  const { active } = useProfiles();

  const shown = tab ? entries.filter((e) => e.status === tab) : entries;
  const count = (s: WatchStatus) => entries.filter((e) => e.status === s).length;

  return (
    <div className="page">
      <div className="page__bar">
        <Link className="page__brand" to="/" aria-label="Anidrx, ir para o início"><Logo /></Link>
        <div className="page__tools">
          <ThemePicker />
          <ProfileMenu />
          <Link className="btn btn--small" to="/">← Início</Link>
        </div>
      </div>
      <h2 className="heading">Minha lista{active ? ` · ${active.name}` : ""}</h2>

      <div className="chips" role="group" aria-label="Status">
        <button className="chip" aria-pressed={tab === ""} onClick={() => setTab("")}>Todos ({entries.length})</button>
        {WATCH_STATUSES.map((s) => (
          <button key={s.value} className="chip" aria-pressed={tab === s.value} onClick={() => setTab(s.value)}>
            {s.label} ({count(s.value)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="state">
          Nada por aqui ainda. Abra um anime e escolha "Minha lista" para marcar como quero ver, assistindo ou concluído.
        </p>
      ) : (
        <ul className="grid">
          {shown.map((e) => (
            <AnimeCard
              key={e.anime.mal_id}
              anime={e.anime}
              favorite={isFavorite(e.anime.mal_id)}
              onOpen={setSelected}
              onToggleFavorite={toggle}
              note={
                e.status === "watching" && e.progress
                  ? `${e.progress}${e.anime.episodes ? `/${e.anime.episodes}` : ""} ep. vistos`
                  : undefined
              }
            />
          ))}
        </ul>
      )}

      {selected && (
        <AnimeModal
          anime={selected}
          favorite={isFavorite(selected.mal_id)}
          onClose={() => setSelected(null)}
          onToggleFavorite={toggle}
        />
      )}
    </div>
  );
}
