import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchAnimeById, fetchEpisodes, fetchRecommendations, fetchStreaming } from "../api";
import Logo from "../components/Logo";
import ThemePicker from "../components/ThemePicker";
import AnimeFacts from "../components/AnimeFacts";
import { useFavorites } from "../hooks/useFavorites";

const DAY = 24 * 60 * 60 * 1000;

type ShareState = "idle" | "copied" | "failed";

function formatDate(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
}

export default function AnimePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggle } = useFavorites();

  const anime = useQuery({
    queryKey: ["anime", "detail", id],
    queryFn: ({ signal }) => fetchAnimeById(id, signal),
    staleTime: DAY,
    retry: false,
  });

  // As chamadas saem em sequência (detalhe → streaming → parecidos) para respeitar o limite da API.
  const streaming = useQuery({
    queryKey: ["anime", "streaming", id],
    queryFn: ({ signal }) => fetchStreaming(id, signal),
    staleTime: DAY,
    retry: false,
    enabled: anime.isSuccess,
  });

  const recs = useQuery({
    queryKey: ["anime", "recs", id],
    queryFn: ({ signal }) => fetchRecommendations(id, signal),
    staleTime: DAY,
    retry: false,
    enabled: streaming.isFetched,
  });

  // Episódios só carregam quando a pessoa pede: poupa chamadas e respeita o limite da API.
  const [showEpisodes, setShowEpisodes] = useState(false);
  const episodes = useInfiniteQuery({
    queryKey: ["anime", "episodes", id],
    queryFn: ({ pageParam, signal }) => fetchEpisodes(id, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.pagination.has_next_page ? pages.length + 1 : undefined),
    staleTime: DAY,
    retry: false,
    enabled: showEpisodes,
  });
  const episodeList = episodes.data?.pages.flatMap((p) => p.data) ?? [];

  const [shareState, setShareState] = useState<ShareState>("idle");

  const data = anime.data;
  const title = data ? (data.title_english ?? data.title) : "";

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setShowEpisodes(false);
  }, [id]);

  useEffect(() => {
    if (title) document.title = `${title} · Anidrx`;
    return () => {
      document.title = "Anidrx";
    };
  }, [title]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} · Anidrx`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // pessoa fechou a janela de compartilhar
      setShareState("failed");
    }
    setTimeout(() => setShareState("idle"), 2500);
  }

  const similar = (recs.data ?? []).slice(0, 6);
  const streams = streaming.data ?? [];

  return (
    <div className="page">
      <div className="page__bar">
        <Link className="page__brand" to="/" aria-label="Anidrx, ir para o início"><Logo /></Link>
        <ThemePicker />
      </div>

      <button
        className="btn btn--small"
        // idx > 0: há uma tela anterior dentro do app (ex.: a busca); senão vai para o início.
        onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"))}
      >
        ← Voltar
      </button>

      {anime.isPending && <p className="state" aria-live="polite">Carregando…</p>}
      {anime.isError && (
        <div className="state state--error" role="alert">
          <p>{anime.error.message}</p>
          <Link className="btn" to="/">Voltar para a busca</Link>
        </div>
      )}

      {data && (
        <article className="detail">
          {data.images.jpg.large_image_url && (
            <div
              className="detail__bg"
              aria-hidden="true"
              style={{ backgroundImage: `url("${data.images.jpg.large_image_url}")` }}
            />
          )}
          {data.images.jpg.large_image_url ? (
            <img
              src={data.images.jpg.large_image_url}
              alt={`Capa de ${title}`}
              referrerPolicy="no-referrer"
              decoding="async"
            />
          ) : (
            <span className="card__placeholder" aria-hidden="true">{title.charAt(0)}</span>
          )}
          <div>
            {data.score ? <span className="detail__score">★ {data.score.toFixed(1)}</span> : null}
            <h1>{title}</h1>
            {data.title_english && data.title_english !== data.title && (
              <p className="modal__original">{data.title}</p>
            )}
            <ul className="tags">
              {data.genres.map((g) => <li key={g.mal_id}>{g.name}</li>)}
            </ul>
            <p className="modal__facts">
              {[
                data.score ? `★ ${data.score.toFixed(2)}` : null,
                data.type,
                data.episodes ? `${data.episodes} episódios` : null,
                data.status,
              ].filter(Boolean).join(" · ")}
            </p>
            <p className="modal__synopsis">{data.synopsis ?? "Sem sinopse disponível."}</p>
            <AnimeFacts anime={data} />
            <div className="modal__actions">
              <button className="btn btn--primary" onClick={() => toggle(data)}>
                {isFavorite(data.mal_id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              </button>
              <button className="btn" onClick={share}>
                {shareState === "copied" ? "Link copiado!" : shareState === "failed" ? "Não foi possível copiar" : "Compartilhar"}
              </button>
              {data.trailer?.url && (
                <a className="btn" href={data.trailer.url} target="_blank" rel="noreferrer">Ver trailer</a>
              )}
              <a className="btn" href={data.url} target="_blank" rel="noreferrer">Abrir no MyAnimeList</a>
            </div>

            {streams.length > 0 && (
              <section className="watch" aria-labelledby="watch-title">
                <h2 id="watch-title">Onde assistir</h2>
                <ul>
                  {streams.map((s) => (
                    <li key={s.url}>
                      <a className="chip" href={s.url} target="_blank" rel="noreferrer">{s.name}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>
      )}

      {data && data.type !== "Movie" && (
        <section className="episodes" aria-labelledby="eps-title">
          <h2 id="eps-title">Episódios</h2>
          {!showEpisodes && (
            <button className="btn" onClick={() => setShowEpisodes(true)}>Ver episódios</button>
          )}
          {showEpisodes && episodes.isPending && <p className="state" aria-live="polite">Carregando episódios…</p>}
          {episodes.isError && <p className="state state--error" role="alert">{episodes.error.message}</p>}
          {episodes.isSuccess && episodeList.length === 0 && (
            <p className="state">Nenhum episódio listado ainda.</p>
          )}
          {episodeList.length > 0 && (
            <ol className="eps">
              {episodeList.map((ep) => (
                <li key={ep.mal_id}>
                  <span className="eps__n">{ep.mal_id}</span>
                  <span className="eps__t">
                    {ep.title ?? `Episódio ${ep.mal_id}`}
                    {ep.filler && <span className="badge">Filler</span>}
                    {ep.recap && <span className="badge">Recap</span>}
                  </span>
                  <span className="eps__d">{formatDate(ep.aired)}</span>
                </li>
              ))}
            </ol>
          )}
          {episodes.hasNextPage && (
            <button
              className="btn episodes__more"
              disabled={episodes.isFetchingNextPage}
              onClick={() => episodes.fetchNextPage()}
            >
              {episodes.isFetchingNextPage ? "Carregando…" : "Carregar mais episódios"}
            </button>
          )}
        </section>
      )}

      {similar.length > 0 && (
        <section className="recs" aria-labelledby="recs-title">
          <h2 id="recs-title">Parecidos com este</h2>
          <ul className="recs__list">
            {similar.map(({ entry }) => (
              <li key={entry.mal_id}>
                <Link className="rec" to={`/anime/${entry.mal_id}`}>
                  <img
                    src={entry.images.jpg.large_image_url || entry.images.jpg.image_url}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <span>{entry.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
