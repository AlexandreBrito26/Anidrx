import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { aniPage, gqlOk, lastBody } from "../test/anilist";
import { makeAnime } from "../test/fixtures";
import type { Anime } from "../types";
import Home from "./Home";

const fetchMock = vi.fn();

function mockSearch(data: Anime[] = []) {
  fetchMock.mockImplementation(async () => gqlOk(aniPage(data)));
}

const lastVars = () => lastBody(fetchMock).variables;

function renderHome(path = "/") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Home />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const frieren = makeAnime(1, { title: "Frieren" });
const naruto = makeAnime(2, { title: "Naruto" });

describe("Home", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("scrollTo", vi.fn());
    localStorage.clear();
  });

  it("começa com os animes mais populares", async () => {
    mockSearch([frieren, naruto]);
    renderHome();

    expect(await screen.findByText("Frieren")).toBeInTheDocument();
    expect(screen.getByText("Naruto")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mais populares agora" })).toBeInTheDocument();
    expect(lastVars().sort).toEqual(["POPULARITY_DESC"]);
  });

  it("ignora animes repetidos na mesma página", async () => {
    mockSearch([frieren, frieren, naruto]);
    renderHome();

    expect(await screen.findAllByText("Frieren")).toHaveLength(1);
    expect(screen.getByText("Naruto")).toBeInTheDocument();
  });

  it("busca pelo texto digitado, depois da pausa do debounce", async () => {
    mockSearch([naruto]);
    renderHome();

    fireEvent.change(screen.getByLabelText("Buscar anime"), { target: { value: "naruto" } });

    await waitFor(() => expect(lastVars().search).toBe("naruto"), { timeout: 2000 });
    expect(await screen.findByRole("heading", { name: "Resultados para “naruto”" })).toBeInTheDocument();
  });

  it("filtra por gênero ao tocar no chip", async () => {
    mockSearch([frieren]);
    renderHome();
    await screen.findByText("Frieren");

    const chip = screen.getByRole("button", { name: "Fantasia" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip);

    await waitFor(() => expect(lastVars().genre).toEqual(["Fantasy"]));
    expect(screen.getByRole("button", { name: "Fantasia" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ordena pela opção escolhida", async () => {
    mockSearch([frieren]);
    renderHome();
    await screen.findByText("Frieren");

    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "score" } });

    await waitFor(() => expect(lastVars().sort).toEqual(["SCORE_DESC"]));
  });

  it("lê busca e filtros da URL ao abrir", async () => {
    mockSearch([naruto]);
    renderHome("/?q=naruto&genre=1");

    expect(screen.getByLabelText("Buscar anime")).toHaveValue("naruto");
    expect(screen.getByRole("button", { name: "Ação" })).toHaveAttribute("aria-pressed", "true");
    await screen.findByText("Naruto");
    expect(lastVars().search).toBe("naruto");
    expect(lastVars().genre).toEqual(["Action"]);
  });

  it("sugere buscas quando nada é encontrado", async () => {
    mockSearch([]);
    renderHome();

    expect(await screen.findByText(/Nada encontrado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Frieren" }));
    expect(screen.getByLabelText("Buscar anime")).toHaveValue("Frieren");
  });

  it("mostra a mensagem do limite de requisições (429)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });
    renderHome();

    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas buscas seguidas");
  });

  it("favorita um anime e mostra só os favoritos", async () => {
    mockSearch([frieren, naruto]);
    renderHome();
    await screen.findByText("Frieren");
    expect(screen.getByRole("button", { name: /Favoritos \(0\)/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Favoritar Frieren" }));
    const favoritesButton = screen.getByRole("button", { name: /Favoritos \(1\)/ });

    fireEvent.click(favoritesButton);
    expect(screen.getByRole("heading", { name: "Seus favoritos" })).toBeInTheDocument();
    expect(screen.getByText("Frieren")).toBeInTheDocument();
    expect(screen.queryByText("Naruto")).toBeNull();
  });

  it("abre os detalhes em um modal e fecha com Esc", async () => {
    mockSearch([frieren]);
    renderHome();

    fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes de Frieren" }));
    expect(screen.getByRole("dialog", { name: "Frieren" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
