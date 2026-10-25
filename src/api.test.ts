import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAnime, fetchAnimeById, fetchEpisodes, fetchRandomAnime, fetchRecommendations, fetchSeasonNow, fetchStreaming } from "./api";
import { aniPage, gqlOk, lastBody, toMedia } from "./test/anilist";
import { makeAnime } from "./test/fixtures";

const fetchMock = vi.fn();
const signal = new AbortController().signal;
const empty = { query: "", type: "", genre: "" };

describe("fetchAnime", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(gqlOk(aniPage([])));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("consulta a AniList e envia texto, tipo, gênero e página", async () => {
    await fetchAnime({ query: "frieren", type: "tv", genre: "10" }, 2, signal);

    expect(fetchMock.mock.calls[0][0]).toBe("https://graphql.anilist.co");
    const { variables } = lastBody(fetchMock);
    expect(variables.search).toBe("frieren");
    expect(variables.format).toEqual(["TV", "TV_SHORT"]);
    expect(variables.genre).toEqual(["Fantasy"]);
    expect(variables.page).toBe(2);
    expect(variables.sort).toEqual(["SEARCH_MATCH"]);
  });

  it("ordena por popularidade quando não há texto", async () => {
    await fetchAnime(empty, 1, signal);
    const { variables } = lastBody(fetchMock);

    expect(variables.search).toBeUndefined();
    expect(variables.sort).toEqual(["POPULARITY_DESC"]);
    expect(variables.format).toBeUndefined();
    expect(variables.genre).toBeUndefined();
  });

  it("respeita a ordenação escolhida", async () => {
    await fetchAnime({ ...empty, order: "score" }, 1, signal);
    expect(lastBody(fetchMock).variables.sort).toEqual(["SCORE_DESC"]);

    await fetchAnime({ ...empty, order: "title" }, 1, signal);
    expect(lastBody(fetchMock).variables.sort).toEqual(["TITLE_ROMAJI"]);

    await fetchAnime({ ...empty, query: "naruto", order: "start_date" }, 1, signal);
    expect(lastBody(fetchMock).variables.sort).toEqual(["START_DATE_DESC"]);
  });

  it("converte o resultado para o formato do app", async () => {
    const media = toMedia(makeAnime(7, { title: "Frieren", score: 8.9 }), {
      format: "MOVIE",
      status: "RELEASING",
      season: "FALL",
      duration: 24,
      description: "Uma maga<br>elfa.",
      trailer: { id: "abc", site: "youtube" },
    });
    fetchMock.mockResolvedValue(
      gqlOk({ Page: { pageInfo: { currentPage: 3, hasNextPage: true, total: 40 }, media: [media] } })
    );
    const res = await fetchAnime(empty, 3, signal);
    const a = res.data[0];

    expect(res.pagination).toEqual({ current_page: 3, has_next_page: true, items: { total: 40 } });
    expect(a.mal_id).toBe(7);
    expect(a.type).toBe("Movie");
    expect(a.status).toBe("Currently Airing");
    expect(a.score).toBe(8.9);
    expect(a.season).toBe("fall");
    expect(a.duration).toBe("24 min per ep");
    expect(a.synopsis).toBe("Uma maga\nelfa.");
    expect(a.trailer?.url).toBe("https://www.youtube.com/watch?v=abc");
  });

  it("explica o limite de requisições (429)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });
    await expect(fetchAnime({ ...empty, query: "x" }, 1, signal)).rejects.toThrow(/Muitas buscas/);
  });

  it("avisa que está sem internet quando o navegador está offline", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await expect(fetchAnime({ ...empty, query: "x" }, 1, signal)).rejects.toThrow(/Sem conexão/);
    vi.restoreAllMocks();
  });

  it("culpa o servidor (não a internet) quando está online e a rede falha", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchAnime({ ...empty, query: "x" }, 1, signal)).rejects.toThrow(/servidor de animes/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("tenta de novo e se recupera de um erro passageiro", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(gqlOk(aniPage([])));
    await expect(fetchAnime({ ...empty, query: "x" }, 1, signal)).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("não repete em 404", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(fetchAnimeById("1", signal)).rejects.toThrow("Anime não encontrado.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("usa uma mensagem genérica para outros erros", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchAnime({ ...empty, query: "x" }, 1, signal)).rejects.toThrow(/Não foi possível buscar/);
  });
});

describe("detalhe, recomendações, streaming e episódios", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("busca o detalhe pelo id", async () => {
    fetchMock.mockResolvedValue(gqlOk({ Media: toMedia(makeAnime(52991, { title: "Frieren" })) }));
    const anime = await fetchAnimeById("52991", signal);

    expect(lastBody(fetchMock).variables.id).toBe(52991);
    expect(anime.mal_id).toBe(52991);
    expect(anime.title).toBe("Frieren");
  });

  it("avisa quando o anime não existe (id inválido ou sem resultado)", async () => {
    await expect(fetchAnimeById("abc", signal)).rejects.toThrow("Anime não encontrado.");
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValue(gqlOk({ Media: null }));
    await expect(fetchAnimeById("999999999", signal)).rejects.toThrow("Anime não encontrado.");
  });

  it("converte as recomendações", async () => {
    fetchMock.mockResolvedValue(
      gqlOk({
        Media: toMedia(makeAnime(1), {
          recommendations: {
            nodes: [
              { rating: 3, mediaRecommendation: toMedia(makeAnime(2, { title: "Mushishi" })) },
              { rating: 1, mediaRecommendation: null },
            ],
          },
        }),
      })
    );
    const recs = await fetchRecommendations("1", signal);

    expect(recs).toHaveLength(1);
    expect(recs[0].votes).toBe(3);
    expect(recs[0].entry.title).toBe("Mushishi");
  });

  it("busca só os links de streaming", async () => {
    fetchMock.mockResolvedValue(
      gqlOk({
        Media: toMedia(makeAnime(1), {
          externalLinks: [
            { site: "Crunchyroll", url: "https://crunchyroll.com/x", type: "STREAMING" },
            { site: "Twitter", url: "https://x.com/y", type: "SOCIAL" },
          ],
        }),
      })
    );
    const links = await fetchStreaming("1", signal);

    expect(links).toEqual([{ name: "Crunchyroll", url: "https://crunchyroll.com/x" }]);
  });

  it("lista os episódios pelos títulos, ou numerados quando não há títulos", async () => {
    fetchMock.mockResolvedValue(gqlOk({ Media: { episodes: 12, streamingEpisodes: [{ title: "Ep 1 - Início" }] } }));
    let page = await fetchEpisodes("1", 1, signal);
    expect(page.data.map((e) => e.title)).toEqual(["Ep 1 - Início"]);
    expect(page.pagination.has_next_page).toBe(false);

    fetchMock.mockResolvedValue(gqlOk({ Media: { episodes: 3, streamingEpisodes: [] } }));
    page = await fetchEpisodes("1", 1, signal);
    expect(page.data.map((e) => e.mal_id)).toEqual([1, 2, 3]);
  });
});

describe("sorteio e temporada", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("sorteia um anime de uma página aleatória", async () => {
    fetchMock.mockResolvedValue(gqlOk(aniPage([makeAnime(5, { title: "Sorteado" })])));
    const a = await fetchRandomAnime(signal);

    expect(a.title).toBe("Sorteado");
    expect(lastBody(fetchMock).variables.page).toBeGreaterThanOrEqual(1);
  });

  it("busca a temporada atual", async () => {
    fetchMock.mockResolvedValue(gqlOk(aniPage([])));
    await fetchSeasonNow(2, signal);
    const { variables } = lastBody(fetchMock);

    expect(variables.page).toBe(2);
    expect(variables.season).toMatch(/^(WINTER|SPRING|SUMMER|FALL)$/);
    expect(variables.year).toBeGreaterThan(2000);
  });
});
