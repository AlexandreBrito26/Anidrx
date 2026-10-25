export interface Anime {
  mal_id: number;
  url: string;
  title: string;
  title_english: string | null;
  images: { jpg: { image_url: string; large_image_url: string } };
  type: string | null;
  episodes: number | null;
  status: string;
  score: number | null;
  year: number | null;
  synopsis: string | null;
  genres: { mal_id: number; name: string }[];
  studios?: { mal_id: number; name: string }[];
  season?: string | null;
  source?: string | null;
  duration?: string | null;
  rating?: string | null;
  rank?: number | null;
  popularity?: number | null;
  trailer?: { url: string | null } | null;
}

export interface SearchResponse {
  data: Anime[];
  pagination: { current_page: number; has_next_page: boolean; items?: { total: number } };
}

// Obra ligada a esta (sequência, prequela, spin-off...). `relation` é o tipo da AniList (ex.: "SEQUEL").
export interface RelatedAnime {
  relation: string;
  entry: {
    mal_id: number;
    title: string;
    images: { jpg: { image_url: string; large_image_url: string } };
    type: string | null;
    year: number | null;
    status: string;
  };
}

// Detalhe de um anime: o Anime em si mais as obras relacionadas (não vai para favoritos/lista).
export interface AnimeDetail extends Anime {
  related: RelatedAnime[];
}

export interface Recommendation {
  entry: {
    mal_id: number;
    title: string;
    images: { jpg: { image_url: string; large_image_url: string } };
  };
  votes: number;
}

export interface StreamingLink {
  name: string;
  url: string;
}

export interface Episode {
  mal_id: number;
  title: string | null;
  aired: string | null;
  filler: boolean;
  recap: boolean;
}

export interface EpisodesPage {
  data: Episode[];
  pagination: { has_next_page: boolean };
}
