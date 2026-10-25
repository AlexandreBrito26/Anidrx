import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAnime, fetchRandomAnime, GENRES, SORTS, TYPES } from "../api";
import AnimeCard from "../components/AnimeCard";
import Logo from "../components/Logo";
import ThemePicker from "../components/ThemePicker";
import ProfileMenu from "../components/ProfileMenu";
import AnimeModal from "../components/AnimeModal";
import SkeletonCard from "../components/SkeletonCard";
import { useDebounce } from "../hooks/useDebounce";
import { useFavorites } from "../hooks/useFavorites";
import { useTheme } from "../hooks/useTheme";
import { COPY } from "../themes";
import type { Anime } from "../types";

const SUGGESTIONS = ["Frieren", "Naruto", "One Piece", "Haikyuu", "Cowboy Bebop"];

export default function Home() {
  // Busca, filtros e página vivem na URL: ?q=frieren&type=tv&genre=10&page=2
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const type = params.get("type") ?? "";
  const genre = params.get("genre") ?? "";
  const order = params.get("order") ?? "";
  const page = Number(params.get("page")) || 1;

  const [input, setInput] = useState(q);
  const [selected, setSelected] = useState<Anime | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [randomState, setRandomState] = useState<"idle" | "loading" | "error">("idle");
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);

  const debounced = useDebounce(input.trim());
  const { favorites, isFavorite, toggle } = useFavorites();
  const { theme } = useTheme();
  const copy = COPY[theme];

  const update = useCallback(
    (changes: Record<string, string>, replace = true) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace }
      );
    },
    [setParams]
  );

  // Texto digitado (já com debounce) -> URL, voltando para a página 1.
  useEffect(() => {
    if (debounced !== q) update({ q: debounced, page: "" });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // URL -> campo de texto (ex.: botão voltar do navegador).
  useEffect(() => {
    if (q !== input.trim()) setInput(q);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atalho: "/" foca a busca.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && !selected && !["INPUT", "SELECT", "TEXTAREA"].includes(tag)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Ao trocar de página, volta ao topo da lista.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [page]);

  const { data, isPending, isFetching, error: queryError } = useQuery({
    queryKey: ["anime", q, type, genre, order, page],
    queryFn: ({ signal }) => fetchAnime({ query: q, type, genre, order }, page, signal),
    placeholderData: keepPreviousData, // mantém a lista anterior enquanto carrega
    staleTime: 5 * 60 * 1000, // buscas repetidas em 5 min vêm do cache
    retry: false,
  });
  // A API às vezes repete o mesmo anime na página; evita chaves duplicadas no React.
  const results = useMemo(() => {
    const seen = new Set<number>();
    return (data?.data ?? []).filter((a) => {
      if (seen.has(a.mal_id)) return false;
      seen.add(a.mal_id);
      return true;
    });
  }, [data]);
  const hasNext = data?.pagination.has_next_page ?? false;
  const total = data?.pagination.items?.total;
  const loading = isFetching;
  const error = queryError ? queryError.message : null;

  const list = onlyFavorites ? favorites : results;
  const showSkeleton = !onlyFavorites && isPending && !error;
  const heading = onlyFavorites
    ? "Seus favoritos"
    : q
      ? `Resultados para “${q}”`
      : copy.popular;

  const surprise = async () => {
    setRandomState("loading");
    try {
      const anime = await fetchRandomAnime(new AbortController().signal);
      setRandomState("idle");
      navigate(`/anime/${anime.mal_id}`);
    } catch {
      setRandomState("error");
    }
  };

  const search = (text: string) => {
    setInput(text);
    setOnlyFavorites(false);
    searchRef.current?.focus();
  };

  return (
    <>
      <header className="top">
        <div className="top__title">
          <h1><Logo /></h1>
          <div className="page__tools">
            <ThemePicker />
            <ProfileMenu />
          </div>
        </div>

      </header>

      <div className="stick">
        <div className="stick__in">
          <div className="search">
            <input
              ref={searchRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setOnlyFavorites(false);
              }}
              placeholder="Busque por título, ex.: Frieren"
              aria-label="Buscar anime"
            />
            {input ? (
              <button className="search__clear" onClick={() => search("")} aria-label="Limpar busca">×</button>
            ) : (
              <kbd className="search__hint" aria-hidden="true">/</kbd>
            )}
          </div>
        </div>
      </div>

      <section className="tools" aria-label="Filtros">
        <div className="top__actions">
          <button
            className={`btn${onlyFavorites ? " btn--primary" : ""}`}
            onClick={() => setOnlyFavorites((v) => !v)}
            aria-pressed={onlyFavorites}
          >
            ♥ Favoritos ({favorites.length})
          </button>
          <Link className="btn" to="/lista">Minha lista</Link>
          <Link className="btn" to="/temporada">Temporada</Link>
          <button className="btn" onClick={surprise} disabled={randomState === "loading"}>
            {randomState === "loading" ? "Sorteando…" : "🎲 Surpreenda-me"}
          </button>
        </div>
        <div className="filters">
          <select
            value={type}
            onChange={(e) => { update({ type: e.target.value, page: "" }); setOnlyFavorites(false); }}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos os tipos</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={order}
            onChange={(e) => { update({ order: e.target.value, page: "" }); setOnlyFavorites(false); }}
            aria-label="Ordenar por"
          >
            <option value="">{q ? "Mais relevantes" : "Ordenar por"}</option>
            {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(type || genre || order) && (
            <button className="btn btn--small" onClick={() => update({ type: "", genre: "", order: "", page: "" })}>
              Limpar filtros
            </button>
          )}
        </div>

        <div className="chips" role="group" aria-label="Gêneros">
          {GENRES.map((g) => (
            <button
              key={g.value}
              className="chip"
              aria-pressed={genre === g.value}
              onClick={() => { update({ genre: genre === g.value ? "" : g.value, page: "" }); setOnlyFavorites(false); }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <main>
        <div className="heading-row">
          <h2 className="heading">{heading}</h2>
          {!onlyFavorites && !error && total !== undefined && (
            <span className="count">{total.toLocaleString("pt-BR")} títulos</span>
          )}
          {onlyFavorites && favorites.length > 0 && (
            <span className="count">{favorites.length} salvos</span>
          )}
        </div>

        <p className="sr-only" aria-live="polite">{loading && !onlyFavorites ? "Buscando…" : ""}</p>

        {randomState === "error" && (
          <p className="state state--error" role="alert">Não foi possível sortear agora. Tente de novo.</p>
        )}
        {!onlyFavorites && error && <p className="state state--error" role="alert">{error}</p>}
        {onlyFavorites && list.length === 0 && (
          <p className="state">Nenhum favorito ainda. Toque no ♡ de um anime para salvar.</p>
        )}
        {!onlyFavorites && !loading && !error && list.length === 0 && (
          <div className="state">
            <p>Nada encontrado. Confira a grafia ou tente um destes:</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => search(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <ul className={`grid${loading && !showSkeleton && !onlyFavorites ? " is-loading" : ""}`}>
          {showSkeleton
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

        {!onlyFavorites && (page > 1 || hasNext) && (
          <nav className="pager" aria-label="Paginação">
            <button
              className="btn"
              disabled={page === 1 || loading}
              onClick={() => update({ page: page - 1 > 1 ? String(page - 1) : "" }, false)}
            >
              ← Anterior
            </button>
            <span>Página {page}</span>
            <button
              className="btn"
              disabled={!hasNext || loading}
              onClick={() => update({ page: String(page + 1) }, false)}
            >
              Próxima →
            </button>
          </nav>
        )}
      </main>

      {selected && (
        <AnimeModal
          anime={selected}
          favorite={isFavorite(selected.mal_id)}
          onClose={() => setSelected(null)}
          onToggleFavorite={toggle}
        />
      )}
    </>
  );
}
