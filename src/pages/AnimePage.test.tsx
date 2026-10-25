import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { gqlOk, toMedia } from "../test/anilist";
import { makeAnime } from "../test/fixtures";
import type { Anime, Episode, Recommendation, StreamingLink } from "../types";
import AnimePage from "./AnimePage";

const fetchMock = vi.fn();

function mockApi({
  detail,
  recs = [],
  streaming = [],
  episodes = [],
  relations = [],
  status = 200,
}: {
  detail?: Anime;
  recs?: Recommendation[];
  streaming?: StreamingLink[];
  episodes?: Episode[];
  relations?: { relationType: string; node: Record<string, unknown> }[];
  status?: number;
}) {
  fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
    if (status !== 200) return { ok: false, status };
    const { query } = JSON.parse(init.body as string);
    if (query.includes("streamingEpisodes")) {
      return gqlOk({ Media: { episodes: episodes.length, streamingEpisodes: episodes.map((e) => ({ title: e.title })) } });
    }
    return gqlOk({
      Media: toMedia(detail as Anime, {
        externalLinks: streaming.map((l) => ({ site: l.name, url: l.url, type: "STREAMING" })),
        relations: { edges: relations },
        recommendations: {
          nodes: recs.map((r) => ({
            rating: r.votes,
            mediaRecommendation: toMedia(makeAnime(r.entry.mal_id, { title: r.entry.title })),
          })),
        },
      }),
    });
  });
}

function renderPage(path = "/anime/1") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/anime/:id" element={<AnimePage />} />
          <Route path="/" element={<p>Início</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const frieren = makeAnime(1, {
  title: "Frieren",
  synopsis: "Uma maga elfa revisita a jornada.",
  studios: [{ mal_id: 1, name: "Madhouse" }],
});

const recommendation: Recommendation = {
  votes: 5,
  entry: { mal_id: 2, title: "Mushishi", images: { jpg: { image_url: "", large_image_url: "" } } },
};

describe("AnimePage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("scrollTo", vi.fn());
    localStorage.clear();
  });

  it("mostra o detalhe e os animes parecidos", async () => {
    mockApi({ detail: frieren, recs: [recommendation] });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Frieren" })).toBeInTheDocument();
    expect(screen.getByText("Uma maga elfa revisita a jornada.")).toBeInTheDocument();
    expect(screen.getByText("Madhouse")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Mushishi" })).toHaveAttribute("href", "/anime/2");
  });

  it("mostra onde assistir quando há links de streaming", async () => {
    mockApi({ detail: frieren, streaming: [{ name: "Crunchyroll", url: "https://crunchyroll.com/x" }] });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Onde assistir" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crunchyroll" })).toHaveAttribute("href", "https://crunchyroll.com/x");
  });

  it("esconde onde assistir quando não há links", async () => {
    mockApi({ detail: frieren, streaming: [], recs: [recommendation] });
    renderPage();

    // Os parecidos só carregam depois do streaming, então isso garante que a consulta já terminou.
    await screen.findByRole("link", { name: "Mushishi" });
    expect(screen.queryByText("Onde assistir")).toBeNull();
  });

  it("esconde a seção de parecidos quando não há recomendações", async () => {
    mockApi({ detail: frieren, recs: [] });
    renderPage();

    await screen.findByRole("heading", { name: "Frieren" });
    expect(screen.queryByText("Parecidos com este")).toBeNull();
  });

  it("mostra sequências e relacionados, com atalho para continuar", async () => {
    mockApi({
      detail: frieren,
      relations: [
        { relationType: "SPIN_OFF", node: { ...toMedia(makeAnime(4, { title: "Extra", year: 2024 })), type: "ANIME" } },
        { relationType: "SEQUEL", node: { ...toMedia(makeAnime(3, { title: "Frieren 2", year: 2026 })), type: "ANIME" } },
        { relationType: "SEQUEL", node: { ...toMedia(makeAnime(2, { title: "Frieren 1.5", year: 2025 })), type: "ANIME" } },
        { relationType: "ADAPTATION", node: { ...toMedia(makeAnime(9, { title: "Frieren (mangá)" })), type: "MANGA" } },
      ],
    });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Sequências e relacionados" })).toBeInTheDocument();
    // Mangá fica de fora; sequências vêm antes do spin-off e da mais antiga para a mais nova.
    const links = screen.getAllByRole("link").filter((l) => l.getAttribute("href")?.startsWith("/anime/"));
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/anime/2", "/anime/2", "/anime/3", "/anime/4"]);
    expect(screen.queryByText("Frieren (mangá)")).toBeNull();
    expect(screen.getByRole("link", { name: "Continuar: Frieren 1.5 →" })).toHaveAttribute("href", "/anime/2");
  });

  it("esconde a seção e o atalho quando não há sequências nem relacionados", async () => {
    mockApi({ detail: frieren, relations: [] });
    renderPage();

    await screen.findByRole("heading", { name: "Frieren" });
    expect(screen.queryByText("Sequências e relacionados")).toBeNull();
    expect(screen.queryByRole("link", { name: /Continuar/ })).toBeNull();
  });

  it("conta os episódios vistos e põe o anime em Assistindo", async () => {
    mockApi({ detail: makeAnime(1, { title: "Frieren", episodes: 12 }) });
    renderPage();

    await screen.findByRole("heading", { name: "Frieren" });
    fireEvent.click(screen.getByRole("button", { name: "Mais um episódio" }));
    fireEvent.click(screen.getByRole("button", { name: "Mais um episódio" }));

    expect(screen.getByLabelText("Quantidade de episódios vistos")).toHaveValue(2);
    expect(screen.getByText("de 12")).toBeInTheDocument();
    expect(screen.getByLabelText("Minha lista")).toHaveValue("watching");

    fireEvent.click(screen.getByRole("button", { name: "Menos um episódio" }));
    expect(screen.getByLabelText("Quantidade de episódios vistos")).toHaveValue(1);
  });

  it("não mostra o contador de episódios para filmes", async () => {
    mockApi({ detail: makeAnime(1, { title: "Filme X", type: "Movie" }) });
    renderPage();

    await screen.findByRole("heading", { name: "Filme X" });
    expect(screen.queryByRole("group", { name: "Episódios assistidos" })).toBeNull();
  });

  it("não guarda as obras relacionadas em Minha lista", async () => {
    mockApi({
      detail: frieren,
      relations: [{ relationType: "SEQUEL", node: { ...toMedia(makeAnime(3, { title: "Frieren 2" })), type: "ANIME" } }],
    });
    renderPage();

    await screen.findByRole("heading", { name: "Frieren" });
    fireEvent.change(screen.getByLabelText("Minha lista"), { target: { value: "watching" } });
    const saved = Object.keys(localStorage).map((k) => localStorage.getItem(k) ?? "").join("");
    expect(saved).toContain("watching");
    expect(saved).not.toContain("related");
  });

  it("não guarda as obras relacionadas nos favoritos", async () => {
    mockApi({
      detail: frieren,
      relations: [{ relationType: "SEQUEL", node: { ...toMedia(makeAnime(3, { title: "Frieren 2" })), type: "ANIME" } }],
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Adicionar aos favoritos" }));
    expect(localStorage.length).toBeGreaterThan(0);
    const saved = Object.keys(localStorage).map((k) => localStorage.getItem(k) ?? "").join("");
    expect(saved).toContain("Frieren");
    expect(saved).not.toContain("related");
  });

  it("mostra erro e um caminho de volta quando o anime não existe", async () => {
    mockApi({ status: 404 });
    renderPage("/anime/0");

    expect(await screen.findByRole("alert")).toHaveTextContent("Anime não encontrado.");
    expect(screen.getByRole("link", { name: "Voltar para a busca" })).toHaveAttribute("href", "/");
  });

  it("carrega os episódios só quando a pessoa pede", async () => {
    mockApi({
      detail: frieren,
      episodes: [{ mal_id: 1, title: "O fim da jornada", aired: "2023-09-29T00:00:00+00:00", filler: false, recap: false }],
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Ver episódios" }));
    expect(await screen.findByText("O fim da jornada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver episódios" })).toBeNull();
    expect(fetchMock.mock.calls.some(([, init]) => String(init.body).includes("streamingEpisodes"))).toBe(true);
  });

  it("avisa quando não há episódios listados", async () => {
    mockApi({ detail: frieren, episodes: [] });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Ver episódios" }));
    expect(await screen.findByText("Nenhum episódio listado ainda.")).toBeInTheDocument();
  });

  it("não mostra episódios para filmes", async () => {
    mockApi({ detail: makeAnime(1, { title: "Filme X", type: "Movie" }) });
    renderPage();

    await screen.findByRole("heading", { name: "Filme X" });
    expect(screen.queryByRole("button", { name: "Ver episódios" })).toBeNull();
  });

  it("alterna o favorito", async () => {
    mockApi({ detail: frieren });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Adicionar aos favoritos" }));
    expect(screen.getByRole("button", { name: "Remover dos favoritos" })).toBeInTheDocument();
  });
});

describe("AnimePage – compartilhar", () => {
  it("copia o link quando o navegador não tem Web Share", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    fetchMock.mockResolvedValue(gqlOk({ Media: toMedia(makeAnime(1, { title: "Frieren" })) }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/anime/1"]}>
          <Routes><Route path="/anime/:id" element={<AnimePage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    fireEvent.click(await screen.findByRole("button", { name: "Compartilhar" }));
    expect(await screen.findByRole("button", { name: "Link copiado!" })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalled();
  });
});
