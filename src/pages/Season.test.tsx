import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeAnime } from "../test/fixtures";
import Season from "./Season";

const fetchMock = vi.fn();

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><Season /></MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Season", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
  });

  it("lista os animes da temporada sem repetir títulos", async () => {
    const a = makeAnime(1, { title: "Alpha" });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [a, a, makeAnime(2, { title: "Beta" })], pagination: { has_next_page: false } }),
    });
    renderPage();
    expect(await screen.findByRole("button", { name: "Ver detalhes de Alpha" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ver detalhes de/ })).toHaveLength(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/seasons/now");
  });

  it("mostra erro amigável quando a API falha", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas buscas seguidas");
  });
});
