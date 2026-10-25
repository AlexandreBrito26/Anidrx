import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { makeAnime } from "../test/fixtures";
import { useWatchlist } from "./useWatchlist";

describe("useWatchlist – episódios assistidos", () => {
  beforeEach(() => localStorage.clear());

  it("ver um episódio coloca o anime em Assistindo", () => {
    const { result } = renderHook(() => useWatchlist());
    const anime = makeAnime(1, { episodes: 12 });

    act(() => result.current.setProgress(anime, 3));
    expect(result.current.progressOf(1)).toBe(3);
    expect(result.current.statusOf(1)).toBe("watching");
  });

  it("chegar no último episódio conclui o anime", () => {
    const { result } = renderHook(() => useWatchlist());
    const anime = makeAnime(1, { episodes: 12 });

    act(() => result.current.setProgress(anime, 12));
    expect(result.current.statusOf(1)).toBe("completed");
  });

  it("limita o progresso ao total e a zero", () => {
    const { result } = renderHook(() => useWatchlist());
    const anime = makeAnime(1, { episodes: 12 });

    act(() => result.current.setProgress(anime, 99));
    expect(result.current.progressOf(1)).toBe(12);
    act(() => result.current.setProgress(anime, -4));
    expect(result.current.progressOf(1)).toBe(0);
  });

  it("aceita qualquer quantidade quando o total é desconhecido", () => {
    const { result } = renderHook(() => useWatchlist());
    const anime = makeAnime(1, { episodes: null });

    act(() => result.current.setProgress(anime, 250));
    expect(result.current.progressOf(1)).toBe(250);
    expect(result.current.statusOf(1)).toBe("watching");
  });

  it("voltar a zero tira de Concluído, mas não põe fora da lista quem já estava nela", () => {
    const { result } = renderHook(() => useWatchlist());
    const anime = makeAnime(1, { episodes: 12 });

    act(() => result.current.setProgress(anime, 12));
    act(() => result.current.setProgress(anime, 0));
    expect(result.current.statusOf(1)).toBe("planned");
    expect(result.current.progressOf(1)).toBe(0);
  });

  it("não cria entrada ao definir zero para um anime fora da lista", () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.setProgress(makeAnime(1), 0));
    expect(result.current.entries).toEqual([]);
  });

  it("concluir pela lista marca todos os episódios; trocar de status preserva o progresso", () => {
    const { result } = renderHook(() => useWatchlist());
    const anime = makeAnime(1, { episodes: 12 });

    act(() => result.current.setProgress(anime, 5));
    act(() => result.current.setStatus(anime, "planned"));
    expect(result.current.progressOf(1)).toBe(5);

    act(() => result.current.setStatus(anime, "completed"));
    expect(result.current.progressOf(1)).toBe(12);
  });

  it("mantém várias cópias do hook sincronizadas (ex.: seletor de status e contador)", () => {
    const a = renderHook(() => useWatchlist());
    const b = renderHook(() => useWatchlist());

    act(() => a.result.current.setProgress(makeAnime(1, { episodes: 12 }), 4));
    expect(b.result.current.progressOf(1)).toBe(4);
    expect(b.result.current.statusOf(1)).toBe("watching");
  });

  it("relê quando outra aba altera a lista", () => {
    const { result } = renderHook(() => useWatchlist());
    const entry = { anime: makeAnime(3, { episodes: 12 }), status: "watching", at: 1, progress: 6 };

    act(() => {
      localStorage.setItem("anidrx:watchlist", JSON.stringify({ "3": entry }));
      window.dispatchEvent(new StorageEvent("storage", { key: "anidrx:watchlist" }));
    });
    expect(result.current.progressOf(3)).toBe(6);
  });

  it("salva e recarrega o progresso, e aceita listas antigas sem o campo", () => {
    const first = renderHook(() => useWatchlist());
    act(() => first.result.current.setProgress(makeAnime(7, { episodes: 24 }), 10));
    first.unmount();
    expect(renderHook(() => useWatchlist()).result.current.progressOf(7)).toBe(10);

    localStorage.setItem(
      "anidrx:watchlist",
      JSON.stringify({
        "1": { anime: makeAnime(1), status: "watching", at: 1 },
        "2": { anime: makeAnime(2), status: "watching", at: 2, progress: "lixo" },
      })
    );
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.progressOf(1)).toBe(0);
    expect(result.current.progressOf(2)).toBe(0);
  });
});
