import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { makeAnime } from "../test/fixtures";
import AnimeModal from "./AnimeModal";

const full = makeAnime(1, {
  title: "Sousou no Frieren",
  title_english: "Frieren: Beyond Journey's End",
  synopsis: "Uma maga elfa revisita a jornada.",
  studios: [{ mal_id: 1, name: "Madhouse" }],
  season: "fall",
  year: 2023,
  rank: 3,
  trailer: { url: "https://youtube.com/watch?v=abc" },
});

function setup(anime = full) {
  const onClose = vi.fn();
  const onToggleFavorite = vi.fn();
  render(<AnimeModal anime={anime} favorite={false} onClose={onClose} onToggleFavorite={onToggleFavorite} />, {
    wrapper: MemoryRouter,
  });
  return { onClose, onToggleFavorite };
}

describe("AnimeModal", () => {
  it("mostra título, sinopse e as informações disponíveis", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Frieren: Beyond Journey's End" })).toBeInTheDocument();
    expect(screen.getByText("Uma maga elfa revisita a jornada.")).toBeInTheDocument();
    expect(screen.getByText("Madhouse")).toBeInTheDocument();
    expect(screen.getByText("Outono 2023")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("omite informações que a API não trouxe", () => {
    setup(makeAnime(2, { studios: [], rank: null }));
    expect(screen.queryByText("Estúdio")).toBeNull();
    expect(screen.queryByText("Ranking")).toBeNull();
    expect(screen.getByText("Sem sinopse disponível.")).toBeInTheDocument();
  });

  it("só mostra o botão de trailer quando existe um", () => {
    const { unmount } = render(
      <AnimeModal anime={full} favorite={false} onClose={() => {}} onToggleFavorite={() => {}} />,
      { wrapper: MemoryRouter }
    );
    expect(screen.getByRole("link", { name: "Ver trailer" })).toHaveAttribute("href", full.trailer!.url);
    unmount();

    setup(makeAnime(3, { trailer: null }));
    expect(screen.queryByRole("link", { name: "Ver trailer" })).toBeNull();
  });

  it("leva para a página própria do anime", () => {
    setup();
    expect(screen.getByRole("link", { name: "Abrir página" })).toHaveAttribute("href", "/anime/1");
  });

  it("foca o botão fechar ao abrir", () => {
    setup();
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });

  it("fecha com Esc e ao clicar fora, mas não ao clicar dentro", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("trava a rolagem da página enquanto aberto e libera ao fechar", () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <AnimeModal anime={full} favorite={false} onClose={onClose} onToggleFavorite={() => {}} />,
      { wrapper: MemoryRouter }
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
