import type { Mock } from "vitest";
import type { Anime } from "../types";

// Converte um Anime (formato do app) no formato de mídia que a AniList devolve.
export function toMedia(a: Anime, extra: Record<string, unknown> = {}) {
  return {
    id: a.mal_id,
    siteUrl: a.url,
    format: a.type === "Movie" ? "MOVIE" : "TV",
    episodes: a.episodes,
    status: "FINISHED",
    averageScore: a.score != null ? a.score * 10 : null,
    seasonYear: a.year,
    season: null,
    source: null,
    duration: null,
    title: { romaji: a.title, english: a.title_english },
    coverImage: { large: a.images.jpg.image_url, extraLarge: a.images.jpg.large_image_url },
    description: a.synopsis,
    genres: a.genres.map((g) => g.name),
    studios: { nodes: (a.studios ?? []).map((s) => ({ id: s.mal_id, name: s.name })) },
    trailer: null,
    ...extra,
  };
}

export function aniPage(animes: Anime[], hasNext = false) {
  return {
    Page: {
      pageInfo: { currentPage: 1, hasNextPage: hasNext, total: animes.length },
      media: animes.map((a) => toMedia(a)),
    },
  };
}

// Resposta HTTP 200 da AniList com o corpo { data }.
export const gqlOk = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });

// Corpo ({ query, variables }) da última chamada ao fetch.
export function lastBody(fetchMock: Mock): { query: string; variables: Record<string, any> } {
  return JSON.parse((fetchMock.mock.calls.at(-1)![1] as RequestInit).body as string);
}
