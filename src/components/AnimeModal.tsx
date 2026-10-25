import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { Anime } from "../types";
import AnimeFacts from "./AnimeFacts";
import WatchSelect from "./WatchSelect";

interface Props {
  anime: Anime;
  favorite: boolean;
  onClose: () => void;
  onToggleFavorite: (anime: Anime) => void;
}

export default function AnimeModal({ anime, favorite, onClose, onToggleFavorite }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const title = anime.title_english ?? anime.title;
  const cover = anime.images.jpg.large_image_url || anime.images.jpg.image_url;
  // Portal no <body>: assim nenhuma barra fixa ou camada da página fica na frente do modal.
  return createPortal(
    <div className="modal" onClick={onClose}>
      <div
        className="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="modal__close" onClick={onClose} aria-label="Fechar">×</button>
        {cover ? (
          <img src={cover} alt={`Capa de ${title}`} referrerPolicy="no-referrer" decoding="async" />
        ) : (
          <span className="card__placeholder" aria-hidden="true">{title.charAt(0)}</span>
        )}
        <div className="modal__body">
          <h2>{title}</h2>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="modal__original">{anime.title}</p>
          )}
          <ul className="tags">
            {anime.genres.map((g) => <li key={g.mal_id}>{g.name}</li>)}
          </ul>
          <p className="modal__facts">
            {[
              anime.score ? `★ ${anime.score.toFixed(2)}` : null,
              anime.type,
              anime.episodes ? `${anime.episodes} episódios` : null,
              anime.status,
            ].filter(Boolean).join(" · ")}
          </p>
          <p className="modal__synopsis">{anime.synopsis ?? "Sem sinopse disponível."}</p>

          <AnimeFacts anime={anime} />

          <WatchSelect anime={anime} />

          <div className="modal__actions">
            <button className="btn btn--primary" onClick={() => onToggleFavorite(anime)}>
              {favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </button>
            <Link className="btn" to={`/anime/${anime.mal_id}`}>
              Abrir página
            </Link>
            {anime.trailer?.url && (
              <a className="btn" href={anime.trailer.url} target="_blank" rel="noreferrer">
                Ver trailer
              </a>
            )}
            <a className="btn" href={anime.url} target="_blank" rel="noreferrer">
              Abrir na AniList
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
