import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAnime, fetchAnimeById, fetchEpisodes, fetchRecommendations, fetchStreaming } from "./api";

const fetchMock = vi.fn();
const signal = new AbortController().signal;

function ok() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data: [], pagination: { current_page: 1, has_next_page: false } }),
  };
}

function lastParams() {
  const url = new URL(fetchMock.mock.calls.at(-1)![0] as string, "http://localhost");
  return { path: url.pathname, params: url.searchParams };
}

describe("fetchAnime", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(ok());
    vi.stubGlobal("fetch", fetchMock);
  });

  it("envia o texto, o tipo, o gênero e a página", async () => {
    await fetchAnime({ query: "frieren", type: "tv", genre: "10" }, 2, signal);
    const { path, params } = lastParams();

    expect(path).toBe("/api/jikan/v4/anime");
    expect(params.get("q")).toBe("frieren");
    expect(params.get("type")).toBe("tv");
    expect(params.get("genres")).toBe("10");
    expect(params.get("page")).toBe("2");
    expect(params.get("sfw")).toBe("true");
    expect(params.has("order_by")).toBe(false);
  });

  it("ordena por popularidade quando não há texto", async () => {
    await fetchAnime({ query: "", type: "", genre: "" }, 1, signal);
    const { params } = lastParams();

    expect(params.has("q")).toBe(false);
    expect(params.get("order_by")).toBe("popularity");
    expect(params.get("sort")).toBe("asc");
    expect(params.has("type")).toBe(false);
    expect(params.has("genres")).toBe(false);
  });

  it("respeita a ordenação escolhida", async () => {
    await fetchAnime({ query: "", type: "", genre: "", order: "score" }, 1, signal);
    expect(lastParams().params.get("order_by")).toBe("score");
    expect(lastParams().params.get("sort")).toBe("desc");

    await fetchAnime({ query: "", type: "", genre: "", order: "title" }, 1, signal);
    expect(lastParams().params.get("sort")).toBe("asc");

    await fetchAnime({ query: "naruto", type: "", genre: "", order: "start_date" }, 1, signal);
    expect(lastParams().params.get("q")).toBe("naruto");
    expect(lastParams().params.get("order_by")).toBe("start_date");
    expect(lastParams().params.get("sort")).toBe("desc");
  });

  it("explica o limite de requisições (429)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });
    await expect(
      fetchAnime({ query: "x", type: "", genre: "" }, 1, signal)
    ).rejects.toThrow(/Muitas buscas/);
  });

  it("avisa que está sem internet quando o navegador está offline", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await expect(
      fetchAnime({ query: "x", type: "", genre: "" }, 1, signal)
    ).rejects.toThrow(/Sem conexão/);
    vi.restoreAllMocks();
  });

  it("culpa o servidor (não a internet) quando está online e a rede falha", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(
      fetchAnime({ query: "x", type: "", genre: "" }, 1, signal)
    ).rejects.toThrow(/servidor de animes/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("tenta de novo e se recupera de um erro passageiro", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(ok());
    await expect(fetchAnime({ query: "x", type: "", genre: "" }, 1, signal)).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("não repete em 404", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(fetchAnimeById("0", signal)).rejects.toThrow("Anime não encontrado.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("usa uma mensagem genérica para outros erros", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(
      fetchAnime({ query: "x", type: "", genre: "" }, 1, signal)
    ).rejects.toThrow(/Não foi possível buscar/);
  });
});

describe("fetchAnimeById e fetchRecommendations", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("busca o detalhe e devolve só o campo data", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { mal_id: 52991 } }) });
    const anime = await fetchAnimeById("52991", signal);

    expect(lastParams().path).toBe("/api/jikan/v4/anime/52991");
    expect(anime.mal_id).toBe(52991);
  });

  it("busca as recomendações do anime", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ votes: 3 }] }) });
    const recs = await fetchRecommendations("52991", signal);

    expect(lastParams().path).toBe("/api/jikan/v4/anime/52991/recommendations");
    expect(recs).toHaveLength(1);
  });

  it("busca os links de streaming do anime", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ name: "Crunchyroll", url: "https://crunchyroll.com/x" }] }),
    });
    const links = await fetchStreaming("52991", signal);

    expect(lastParams().path).toBe("/api/jikan/v4/anime/52991/streaming");
    expect(links[0].name).toBe("Crunchyroll");
  });

  it("busca uma página de episódios", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ mal_id: 1 }], pagination: { has_next_page: true } }),
    });
    const page = await fetchEpisodes("52991", 2, signal);

    expect(lastParams().path).toBe("/api/jikan/v4/anime/52991/episodes");
    expect(lastParams().params.get("page")).toBe("2");
    expect(page.pagination.has_next_page).toBe(true);
  });

  it("avisa quando o anime não existe (404)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(fetchAnimeById("0", signal)).rejects.toThrow("Anime não encontrado.");
  });
});
