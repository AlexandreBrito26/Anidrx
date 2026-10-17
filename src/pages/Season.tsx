import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchSeasonNow } from "../api";
import Logo from "../components/Logo";
import ThemePicker from "../components/ThemePicker";
import AnimeCard from "../components/AnimeCard";
import AnimeModal from "../components/AnimeModal";
import SkeletonCard from "../components/SkeletonCard";
import { useFavorites } from "../hooks/useFavorites";
import type { Anime } from "../types";

export default function Season() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Anime | null>(null);
  const { isFavorite, toggle } = useFavorites();

  const { data, isPending, isFetching, error } = useQuery({
    queryKey: ["anime", "season-now", page],
    queryFn: ({ signal }) => fetchSeasonNow(page, signal),
    placeholderData: keepPreviousData,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  // A API pode repetir títulos entre páginas; evita chaves duplicadas.
  const list = useMemo(() => {
    const seen = new Set<number>();
    return (data?.data ?? []).filter((a) => !seen.has(a.mal_id) && seen.add(a.mal_id));
  }, [data]);
  const hasNext = data?.pagination.has_next_page ?? false;

  return (
    <div className="page">
      <div className="page__bar">
        <Link className="page__brand" to="/" aria-label="Anidrx, ir para o início"><Logo /></Link>
        <div className="page__tools">
          <ThemePicker />
          <Link className="btn btn--small" to="/">← Início</Link>
        </div>
      </div>
      <h2 className="heading">No ar nesta temporada</h2>

      {error && <p className="state state--error" role="alert">{error.message}</p>}

      <ul className={`grid${isFetching && !isPending ? " is-loading" : ""}`}>
        {isPending && !error
          ? Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)
          : list.map((a) => (
              <AnimeCard
                key={a.mal_id}
                anime={a}
                favorite={isFavorite(a.mal_id)}
                onOpen={setSelected}
                onToggleFavorite={toggle}
              />
            ))}
      </ul>

      {(page > 1 || hasNext) && (
        <nav className="pager" aria-label="Paginação">
          <button className="btn" disabled={page === 1 || isFetching} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0 }); }}>
            ← Anterior
          </button>
          <span>Página {page}</span>
          <button className="btn" disabled={!hasNext || isFetching} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0 }); }}>
            Próxima →
          </button>
        </nav>
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
