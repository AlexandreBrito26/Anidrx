import type { Anime, EpisodesPage, Recommendation, SearchResponse, StreamingLink } from "./types";

const BASE = "https://api.jikan.moe/v4";

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

async function request(path: string, signal: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Sem conexão. Verifique sua internet e tente de novo.");
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
