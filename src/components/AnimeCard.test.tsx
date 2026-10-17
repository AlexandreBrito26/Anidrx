import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { makeAnime } from "../test/fixtures";
import AnimeCard from "./AnimeCard";

function setup(props: Partial<ComponentProps<typeof AnimeCard>> = {}) {
  const onOpen = vi.fn();
  const onToggleFavorite = vi.fn();
  const anime = props.anime ?? makeAnime(1, { title: "Frieren", score: 9.3 });
  const view = render(
    <ul>
      <AnimeCard anime={anime} favorite={false} onOpen={onOpen} onToggleFavorite={onToggleFavorite} {...props} />
    </ul>
  );
  return { onOpen, onToggleFavorite, anime, ...view };
}

describe("AnimeCard", () => {
  it("mostra título, metadados e nota", () => {
    setup();
    expect(screen.getByText("Frieren")).toBeInTheDocument();
    expect(screen.getByText("TV · 2020 · 12 ep.")).toBeInTheDocument();
    expect(screen.getByText("★ 9.3")).toHaveClass("is-high");
  });

  it("abre os detalhes ao clicar no card", () => {
    const { onOpen, anime } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Frieren" }));
    expect(onOpen).toHaveBeenCalledWith(anime);
  });

  it("favorita e reflete o estado em aria-pressed", () => {
    const { onToggleFavorite, anime, unmount } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Favoritar Frieren" }));
    expect(onToggleFavorite).toHaveBeenCalledWith(anime);
    unmount();

    setup({ favorite: true });
    expect(screen.getByRole("button", { name: "Remover Frieren dos favoritos" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("troca a capa por um placeholder quando a imagem falha", () => {
    const anime = makeAnime(2, {
      title: "Naruto",
      images: { jpg: { image_url: "", large_image_url: "https://exemplo.com/capa.jpg" } },
    });
    const { container } = setup({ anime });
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");

    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".card__placeholder")).toHaveTextContent("N");
  });
});
