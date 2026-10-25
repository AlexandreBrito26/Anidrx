// Rótulos em português do Brasil para o que a AniList devolve em inglês.
// Traduzimos na hora de exibir (e não em api.ts): os dados continuam no formato canônico e os
// animes antigos já salvos nos favoritos/lista também aparecem em português.
// Todo helper devolve o próprio valor quando não conhece a tradução.

const GENRES: Record<string, string> = {
  Action: "Ação",
  Adventure: "Aventura",
  Comedy: "Comédia",
  Drama: "Drama",
  Ecchi: "Ecchi",
  Fantasy: "Fantasia",
  Hentai: "Hentai",
  Horror: "Terror",
  "Mahou Shoujo": "Garota mágica",
  Mecha: "Mecha",
  Music: "Música",
  Mystery: "Mistério",
  Psychological: "Psicológico",
  Romance: "Romance",
  "Sci-Fi": "Ficção científica",
  "Slice of Life": "Cotidiano",
  Sports: "Esportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspense",
};

const STATUSES: Record<string, string> = {
  "Finished Airing": "Finalizado",
  "Currently Airing": "Em exibição",
  "Not yet aired": "Ainda não exibido",
  Cancelled: "Cancelado",
  "On Hiatus": "Em hiato",
};

const TYPES: Record<string, string> = {
  Movie: "Filme",
  Special: "Especial",
  Music: "Música",
};

const SOURCES: Record<string, string> = {
  Original: "Original",
  Manga: "Mangá",
  "Light Novel": "Light novel",
  "Visual Novel": "Visual novel",
  "Video Game": "Videogame",
  Novel: "Romance (livro)",
  Doujinshi: "Dōjinshi",
  Anime: "Anime",
  "Web Novel": "Web novel",
  "Live Action": "Live-action",
  Game: "Jogo",
  Comic: "Quadrinhos",
  "Multimedia Project": "Projeto multimídia",
  "Picture Book": "Livro ilustrado",
  Other: "Outro",
};

const RELATIONS: Record<string, string> = {
  PREQUEL: "Prequela",
  SEQUEL: "Sequência",
  PARENT: "Obra principal",
  SIDE_STORY: "História paralela",
  SPIN_OFF: "Spin-off",
  ALTERNATIVE: "Versão alternativa",
  SUMMARY: "Resumo",
  COMPILATION: "Compilação",
  CONTAINS: "Contém",
  CHARACTER: "Mesmos personagens",
  OTHER: "Relacionado",
};

export const genrePt = (name: string): string => GENRES[name] ?? name;

export const relationPt = (relation: string): string => RELATIONS[relation] ?? relation;

export const statusPt = (status: string): string => STATUSES[status] ?? status;

export const typePt = (type: string | null | undefined): string | null =>
  type ? (TYPES[type] ?? type) : null;

export const sourcePt = (source: string | null | undefined): string | null =>
  source ? (SOURCES[source] ?? source) : null;

// "24 min per ep" → "24 min por episódio"
export const durationPt = (duration: string | null | undefined): string | null =>
  duration ? duration.replace(/\bmin per ep\b/i, "min por episódio") : null;
