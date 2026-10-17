import type { Anime, EpisodesPage, Recommendation, SearchResponse, StreamingLink } from "./types";

// Passa pelo proxy da Vercel (api/jikan), que consulta https://api.jikan.moe/v4.
const BASE = "/api/jikan/v4";

export interface Filters {
  query: string;
  type: string;
  genre: string;
  order?: string;
}

export const TYPES = [
  { value: "tv", label: "Série" },
  { value: "movie", label: "Filme" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "special", label: "Especial" },
];

export const SORTS = [
  { value: "popularity", label: "Popularidade" },
  { value: "score", label: "Maior nota" },
  { value: "start_date", label: "Mais recentes" },
  { value: "title", label: "A–Z" },
];

// IDs de gênero da API Jikan
export const GENRES = [
  { value: "1", label: "Ação" },
  { value: "2", label: "Aventura" },
  { value: "4", label: "Comédia" },
  { value: "8", label: "Drama" },
  { value: "10", label: "Fantasia" },
  { value: "14", label: "Terror" },
  { value: "22", label: "Romance" },
  { value: "24", label: "Ficção científica" },
  { value: "30", label: "Esportes" },
  { value: "36", label: "Cotidiano" },
  { value: "37", label: "Sobrenatural" },
];

export async function fetchAnime(
  { query, type, genre, order }: Filters,
  page: number,
  signal: AbortSignal
): Promise<SearchResponse> {
  const params = new URLSearchParams({ page: String(page), limit: "24", sfw: "true" });
  if (query) params.set("q", query);

  // Sem ordem escolhida: relevância quando há texto; popularidade quando não há.
  const orderBy = order || (query ? "" : "popularity");
  if (orderBy) {
    params.set("order_by", orderBy);
    // Popularidade e título são rankings/alfabético (crescente); o resto, do maior para o menor.
    params.set("sort", orderBy === "popularity" || orderBy === "title" ? "asc" : "desc");
  }
  if (type) params.set("type", type);
  if (genre) params.set("genres", genre);

  const res = await request(`/anime?${params}`, signal);
  return res.json();
}

// A Jikan oscila bastante: 429 (limite), 502/503/504 (fora do ar/lenta). Em erro de gateway
// a resposta vem sem cabeçalho CORS, e o navegador reporta como falha de rede (TypeError).
// Por isso tentamos de novo algumas vezes antes de desistir.
const RETRIES = import.meta.env.MODE === "test" ? 2 : 3;
const RETRY_BASE_MS = import.meta.env.MODE === "test" ? 0 : 700;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

const retryable = (status: number) => status === 429 || status >= 500;

async function request(path: string, signal: AbortSignal): Promise<Response> {
  let res: Response | undefined;
  let networkFailed = false;

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_BASE_MS * 2 ** (attempt - 1), signal);
    try {
      res = await fetch(`${BASE}${path}`, { signal });
      networkFailed = false;
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      res = undefined;
      networkFailed = true;
      continue;
    }
    if (res.ok || !retryable(res.status)) break;
  }

  if (networkFailed || !res) {
    throw new Error(
      typeof navigator !== "undefined" && navigator.onLine === false
        ? "Sem conexão. Verifique sua internet e tente de novo."
        : "Não conseguimos falar com o servidor de animes agora. Ele pode estar instável; tente de novo em instantes."
    );
  }
  if (!res.ok) {
    throw new Error(
      res.status === 429
        ? "Muitas buscas seguidas. Espere um instante e tente de novo."
        : res.status === 404
          ? "Anime não encontrado."
          : "Não foi possível buscar agora. Tente novamente."
    );
  }
  return res;
}

export async function fetchAnimeById(id: string, signal: AbortSignal): Promise<Anime> {
  const res = await request(`/anime/${encodeURIComponent(id)}`, signal);
  return (await res.json()).data;
}

export async function fetchRecommendations(id: string, signal: AbortSignal): Promise<Recommendation[]> {
  const res = await request(`/anime/${encodeURIComponent(id)}/recommendations`, signal);
  return (await res.json()).data;
}

export async function fetchStreaming(id: string, signal: AbortSignal): Promise<StreamingLink[]> {
  const res = await request(`/anime/${encodeURIComponent(id)}/streaming`, signal);
  return (await res.json()).data;
}

export async function fetchEpisodes(id: string, page: number, signal: AbortSignal): Promise<EpisodesPage> {
  const res = await request(`/anime/${encodeURIComponent(id)}/episodes?page=${page}`, signal);
  return res.json();
}

export async function fetchRandomAnime(signal: AbortSignal): Promise<Anime> {
  const res = await request("/random/anime?sfw=true", signal);
  return (await res.json()).data;
}

export async function fetchSeasonNow(page: number, signal: AbortSignal): Promise<SearchResponse> {
  const res = await request(`/seasons/now?page=${page}&limit=24&sfw=true`, signal);
  return res.json();
}
