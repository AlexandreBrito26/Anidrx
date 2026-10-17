import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { makeAnime } from "../test/fixtures";
import { useFavorites } from "./useFavorites";

describe("useFavorites", () => {
  beforeEach(() => localStorage.clear());

  it("começa vazio", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it("adiciona e remove um anime ao alternar", () => {
    const { result } = renderHook(() => useFavorites());
    const anime = makeAnime(1);

    act(() => result.current.toggle(anime));
    expect(result.current.isFavorite(1)).toBe(true);

    act(() => result.current.toggle(anime));
    expect(result.current.isFavorite(1)).toBe(false);
  });

  it("coloca o favorito mais recente primeiro", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggle(makeAnime(1)));
    act(() => result.current.toggle(makeAnime(2)));
    expect(result.current.favorites.map((a) => a.mal_id)).toEqual([2, 1]);
  });

  it("salva no localStorage e recarrega na próxima montagem", () => {
    const first = renderHook(() => useFavorites());
    act(() => first.result.current.toggle(makeAnime(7)));
    first.unmount();

    const second = renderHook(() => useFavorites());
    expect(second.result.current.isFavorite(7)).toBe(true);
  });

  it("ignora dados corrompidos no localStorage", () => {
    localStorage.setItem("anidrx:favorites", "{não é json");
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });
});
