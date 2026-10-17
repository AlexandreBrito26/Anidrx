import { useState } from "react";
import type { Anime } from "../types";

interface Props {
  anime: Anime;
  favorite: boolean;
  onOpen: (anime: Anime) => void;
  onToggleFavorite: (anime: Anime) => void;
}

export default function AnimeCard({ anime, favorite, onOpen, onToggleFavorite }: Props) {
  const [broken, setBroken] = useState(false);
  const title = anime.title_english ?? anime.title;
  const src = anime.images.jpg.large_image_url || anime.images.jpg.image_url;

  return (
    <li className="card">
      <button className="card__open" onClick={() => onOpen(anime)} aria-label={`Ver detalhes de ${title}`}>
        {src && !broken ? (
          <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
        ) : (
          <span className="card__placeholder" aria-hidden="true">{title.charAt(0)}</span>
        )}
        {anime.score && (
          <span className={`card__score${anime.score >= 8 ? " is-high" : ""}`}>★ {anime.score.toFixed(1)}</span>
        )}
        <span className="card__title">{title}</span>
        <span className="card__meta">
          {[anime.type, anime.year, anime.episodes ? `${anime.episodes} ep.` : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </button>
      <button
        className={`card__fav${favorite ? " is-on" : ""}`}
        onClick={() => onToggleFavorite(anime)}
        aria-pressed={favorite}
        aria-label={favorite ? `Remover ${title} dos favoritos` : `Favoritar ${title}`}
      >
        {favorite ? "♥" : "♡"}
      </button>
    </li>
  );
}
