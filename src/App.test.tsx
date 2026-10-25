import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/temporada"]}><App /></MemoryRouter>
    </QueryClientProvider>
  );
}

const pickTheme = (value: string) =>
  fireEvent.change(screen.getByRole("combobox", { name: "Tema" }), { target: { value } });

describe("Temas e efeitos de fundo", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { Page: { pageInfo: { currentPage: 1, hasNextPage: false, total: 0 }, media: [] } } }) }));
  });

  it("cada tema tem o seu cenário e a escolha fica salva", () => {
    localStorage.setItem("anidrx:effects", "on");
    const { container } = renderApp();

    for (const theme of ["light", "dark", "winter", "halloween", "autumn", "spring", "matsuri", "xmas", "newyear", "cyber", "galaxy", "ocean", "manga"]) {
      pickTheme(theme);
      expect(container.querySelector(`.scene--${theme}`)).not.toBeNull();
      expect(container.querySelector(`.scene--${theme}`)!.children.length).toBeGreaterThan(0);
      expect(document.documentElement.dataset.theme).toBe(theme);
      expect(localStorage.getItem("anidrx:theme")).toBe(theme);
    }
  });

  it("a noite tem estrelas cadentes, o inverno tem neve e o outono tem folhas", () => {
    localStorage.setItem("anidrx:effects", "on");
    const { container } = renderApp();
    pickTheme("dark");
    expect(container.querySelectorAll(".sky__meteor").length).toBeGreaterThan(0);
    pickTheme("winter");
    expect(container.querySelectorAll(".flake").length).toBeGreaterThan(0);
    pickTheme("autumn");
    expect(container.querySelectorAll(".leaf").length).toBeGreaterThan(0);
  });

  it("o botão liga e desliga os efeitos e lembra a escolha", () => {
    localStorage.setItem("anidrx:effects", "on");
    const { container } = renderApp();
    expect(container.querySelector(".scene")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Efeitos de fundo" }));
    expect(container.querySelector(".scene")).toBeNull();
    expect(localStorage.getItem("anidrx:effects")).toBe("off");

    fireEvent.click(screen.getByRole("button", { name: "Efeitos de fundo" }));
    expect(container.querySelector(".scene")).not.toBeNull();
  });

  it("começa desligado quando a escolha salva é desligar", () => {
    localStorage.setItem("anidrx:effects", "off");
    const { container } = renderApp();
    expect(container.querySelector(".scene")).toBeNull();
    expect(screen.getByRole("button", { name: "Efeitos de fundo" })).toHaveAttribute("aria-pressed", "false");
  });
});
