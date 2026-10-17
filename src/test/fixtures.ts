import type { Anime } from "../types";

export function makeAnime(id: number, overrides: Partial<Anime> = {}): Anime {
  return {
    mal_id: id,
    url: `https://myanimelist.net/anime/${id}`,
    title: `Anime ${id}`,
    title_english: null,
    images: { jpg: { image_url: "", large_image_url: "" } },
    type: "TV",
    episodes: 12,
    status: "Finished Airing",
    score: 8.1,
    year: 2020,
    synopsis: null,
    genres: [],
    ...overrides,
  };
}
