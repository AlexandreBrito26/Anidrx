import type { Anime, EpisodesPage, Recommendation, SearchResponse, StreamingLink } from "./types";

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

// Os valores são ids de gênero do MyAnimeList (ficam na URL); GENRE_NAMES os traduz para a AniList.
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

// ---- AniList (GraphQL) -------------------------------------------------------------------
// API pública e gratuita, sem chave, que aceita chamadas direto do navegador (CORS).
const ENDPOINT = "https://graphql.anilist.co";

const GENRE_NAMES: Record<string, string> = {
  "1": "Action",
  "2": "Adventure",
  "4": "Comedy",
  "8": "Drama",
  "10": "Fantasy",
  "14": "Horror",
  "22": "Romance",
  "24": "Sci-Fi",
  "30": "Sports",
  "36": "Slice of Life",
  "37": "Supernatural",
};

const FORMATS: Record<string, string[]> = {
  tv: ["TV", "TV_SHORT"],
  movie: ["MOVIE"],
  ova: ["OVA"],
  ona: ["ONA"],
  special: ["SPECIAL"],
};

const FORMAT_LABEL: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

const STATUS_LABEL: Record<string, string> = {
  FINISHED: "Finished Airing",
  RELEASING: "Currently Airing",
  NOT_YET_RELEASED: "Not yet aired",
  CANCELLED: "Cancelled",
  HIATUS: "On Hiatus",
};

const SORT: Record<string, string> = {
  popularity: "POPULARITY_DESC",
  score: "SCORE_DESC",
  start_date: "START_DATE_DESC",
  title: "TITLE_ROMAJI",
};

const MEDIA = `
  id siteUrl format episodes status averageScore seasonYear season source duration
  title { romaji english }
  coverImage { large extraLarge }
  description(asHtml: false)
  genres
  studios(isMain: true) { nodes { id name } }
  trailer { id site }
`;

const PAGE_INFO = "pageInfo { currentPage hasNextPage total }";

interface AniMedia {
  id: number;
  siteUrl: string | null;
  format: string | null;
  episodes: number | null;
  status: string | null;
  averageScore: number | null;
  seasonYear: number | null;
  season: string | null;
  source: string | null;
  duration: number | null;
  title: { romaji: string | null; english: string | null };
  coverImage: { large: string | null; extraLarge: string | null } | null;
  description: string | null;
  genres: string[] | null;
  studios?: { nodes: { id: number; name: string }[] } | null;
  trailer?: { id: string | null; site: string | null } | null;
  rankings?: { rank: number; type: string; allTime: boolean }[] | null;
  externalLinks?: { site: string; url: string | null; type: string }[] | null;
  recommendations?: {
    nodes: { rating: number | null; mediaRecommendation: AniMedia | null }[];
  } | null;
}

interface AniPage {
  pageInfo: { currentPage: number; hasNextPage: boolean; total: number };
  media: AniMedia[];
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const stripHtml = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function toAnime(m: AniMedia): Anime {
  const large = m.coverImage?.large ?? "";
  const cover = m.coverImage?.extraLarge ?? large;
  const romaji = m.title.romaji ?? m.title.english ?? "";
  const trailer =
    m.trailer?.id && m.trailer.site === "youtube"
      ? { url: `https://www.youtube.com/watch?v=${m.trailer.id}` }
      : m.trailer?.id && m.trailer.site === "dailymotion"
        ? { url: `https://www.dailymotion.com/video/${m.trailer.id}` }
        : null;
  const allTime = m.rankings?.find((r) => r.type === "RATED" && r.allTime);

  return {
    mal_id: m.id, // o app usa este campo como id; aqui é o id da AniList
    url: m.siteUrl ?? `https://anilist.co/anime/${m.id}`,
    title: romaji,
    title_english: m.title.english,
    images: { jpg: { image_url: large || cover, large_image_url: cover } },
    type: m.format ? (FORMAT_LABEL[m.format] ?? titleCase(m.format)) : null,
    episodes: m.episodes,
    status: m.status ? (STATUS_LABEL[m.status] ?? titleCase(m.status)) : "",
    score: m.averageScore != null ? Math.round(m.averageScore) / 10 : null,
    year: m.seasonYear,
    synopsis: m.description ? stripHtml(m.description) : null,
    genres: (m.genres ?? []).map((name, i) => ({ mal_id: i, name })),
    studios: m.studios?.nodes.map((n) => ({ mal_id: n.id, name: n.name })),
    season: m.season ? m.season.toLowerCase() : null,
    source: m.source ? titleCase(m.source) : null,
    duration: m.duration ? `${m.duration} min per ep` : null,
    rating: null,
    rank: allTime?.rank ?? null,
    popularity: null,
    trailer,
  };
}

function toPage(page: AniPage): SearchResponse {
  return {
    data: page.media.map(toAnime),
    pagination: {
      current_page: page.pageInfo.currentPage,
      has_next_page: page.pageInfo.hasNextPage,
      items: { total: page.pageInfo.total },
    },
  };
}

const REQUEST_TIMEOUT_MS = 12_000;

// fetch com limite de tempo: sem isso, uma resposta que nunca chega deixa a tela carregando para sempre.
function timedFetch(url: string, init: RequestInit, signal: AbortSignal): Promise<Response> {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  const timer = setTimeout(onAbort, REQUEST_TIMEOUT_MS);
  signal.addEventListener("abort", onAbort, { once: true });
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
  });
}

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

// Faz a consulta GraphQL com tentativas, limite de tempo e mensagens de erro em português.
async function gql<T>(query: string, variables: Record<string, unknown>, signal: AbortSignal): Promise<T> {
  let res: Response | undefined;
  let networkFailed = false;
  const init: RequestInit = {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  };

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_BASE_MS * 2 ** (attempt - 1), signal);
    try {
      res = await timedFetch(ENDPOINT, init, signal);
      networkFailed = false;
    } catch (err) {
      // Cancelamento pedido pelo app (nova busca, troca de página): não é falha de rede.
      if (signal.aborted) throw err;
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
  const json = await res.json();
  if (!json.data) throw new Error("Não foi possível buscar agora. Tente novamente.");
  return json.data as T;
}

export async function fetchAnime(
  { query, type, genre, order }: Filters,
  page: number,
  signal: AbortSignal
): Promise<SearchResponse> {
  // Sem ordem escolhida: relevância quando há texto; popularidade quando não há.
  const sort = order ? SORT[order] : query ? "SEARCH_MATCH" : "POPULARITY_DESC";
  const data = await gql<{ Page: AniPage }>(
    `query ($page: Int, $search: String, $format: [MediaFormat], $genre: [String], $sort: [MediaSort]) {
      Page(page: $page, perPage: 24) {
        ${PAGE_INFO}
        media(type: ANIME, isAdult: false, search: $search, format_in: $format, genre_in: $genre, sort: $sort) { ${MEDIA} }
      }
    }`,
    {
      page,
      search: query || undefined,
      format: type ? FORMATS[type] : undefined,
      genre: genre && GENRE_NAMES[genre] ? [GENRE_NAMES[genre]] : undefined,
      sort: [sort],
    },
    signal
  );
  return toPage(data.Page);
}

const DETAIL = `
  ${MEDIA}
  rankings { rank type allTime }
  externalLinks { site url type }
  recommendations(sort: RATING_DESC, perPage: 12) {
    nodes { rating mediaRecommendation { id title { romaji english } coverImage { large extraLarge } } }
  }
`;

const notFound = () => new Error("Anime não encontrado.");

async function fetchDetail(id: string, signal: AbortSignal): Promise<AniMedia> {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw notFound();
  const data = await gql<{ Media: AniMedia | null }>(
    `query ($id: Int) { Media(id: $id, type: ANIME) { ${DETAIL} } }`,
    { id: n },
    signal
  );
  if (!data.Media) throw notFound();
  return data.Media;
}

export async function fetchAnimeById(id: string, signal: AbortSignal): Promise<Anime> {
  return toAnime(await fetchDetail(id, signal));
}

export async function fetchRecommendations(id: string, signal: AbortSignal): Promise<Recommendation[]> {
  const media = await fetchDetail(id, signal);
  return (media.recommendations?.nodes ?? [])
    .filter((n) => n.mediaRecommendation)
    .map((n) => {
      const a = toAnime(n.mediaRecommendation as AniMedia);
      return {
        entry: { mal_id: a.mal_id, title: a.title, images: a.images },
        votes: Math.max(0, n.rating ?? 0),
      };
    });
}

export async function fetchStreaming(id: string, signal: AbortSignal): Promise<StreamingLink[]> {
  const media = await fetchDetail(id, signal);
  return (media.externalLinks ?? [])
    .filter((l) => l.type === "STREAMING" && l.url)
    .map((l) => ({ name: l.site, url: l.url as string }));
}

// A AniList não traz a lista de episódios com datas: usamos os títulos de streaming quando
// existem e, senão, uma lista numerada a partir da contagem de episódios.
export async function fetchEpisodes(id: string, _page: number, signal: AbortSignal): Promise<EpisodesPage> {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw notFound();
  const data = await gql<{ Media: { episodes: number | null; streamingEpisodes: { title: string | null }[] } | null }>(
    `query ($id: Int) { Media(id: $id, type: ANIME) { episodes streamingEpisodes { title } } }`,
    { id: n },
    signal
  );
  if (!data.Media) throw notFound();
  const titled = data.Media.streamingEpisodes ?? [];
  const count = titled.length || Math.min(data.Media.episodes ?? 0, 500);
  const list = Array.from({ length: count }, (_, i) => ({
    mal_id: i + 1,
    title: titled[i]?.title ?? null,
    aired: null,
    filler: false,
    recap: false,
  }));
  return { data: list, pagination: { has_next_page: false } };
}

export async function fetchRandomAnime(signal: AbortSignal): Promise<Anime> {
  const page = 1 + Math.floor(Math.random() * 1500);
  const data = await gql<{ Page: AniPage }>(
    `query ($page: Int) {
      Page(page: $page, perPage: 1) {
        ${PAGE_INFO}
        media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) { ${MEDIA} }
      }
    }`,
    { page },
    signal
  );
  if (!data.Page.media[0]) throw notFound();
  return toAnime(data.Page.media[0]);
}

function currentSeason(now = new Date()): { season: string; year: number } {
  const m = now.getMonth(); // 0 = janeiro
  const year = now.getFullYear();
  if (m === 11) return { season: "WINTER", year: year + 1 }; // a AniList conta dezembro como inverno do ano seguinte
  if (m <= 1) return { season: "WINTER", year };
  if (m <= 4) return { season: "SPRING", year };
  if (m <= 7) return { season: "SUMMER", year };
  return { season: "FALL", year };
}

export async function fetchSeasonNow(page: number, signal: AbortSignal): Promise<SearchResponse> {
  const { season, year } = currentSeason();
  const data = await gql<{ Page: AniPage }>(
    `query ($page: Int, $season: MediaSeason, $year: Int) {
      Page(page: $page, perPage: 24) {
        ${PAGE_INFO}
        media(type: ANIME, isAdult: false, season: $season, seasonYear: $year, sort: POPULARITY_DESC) { ${MEDIA} }
      }
    }`,
    { page, season, year },
    signal
  );
  return toPage(data.Page);
}
