import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useFavorites } from "./hooks/useFavorites";
import { useWatchlist } from "./hooks/useWatchlist";
import { createProfile, deleteProfile, reloadProfiles, switchProfile } from "./profiles";
import { makeAnime } from "./test/fixtures";

describe("perfis locais", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadProfiles();
  });

  it("rejeita nome vazio e limita o tamanho", () => {
    expect(createProfile("   ", "🦊")).toBeNull();
    expect(createProfile("x".repeat(80), "🦊")?.name).toHaveLength(24);
  });

  it("cada perfil tem os seus favoritos, separados do visitante", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(makeAnime(1)));
    expect(result.current.isFavorite(1)).toBe(true);

    act(() => {
      createProfile("Ana", "🦊"); // primeiro perfil herda os favoritos do visitante
    });
    expect(result.current.isFavorite(1)).toBe(true);
    act(() => result.current.toggle(makeAnime(2)));

    act(() => {
      createProfile("Bia", "🐱"); // segundo perfil começa vazio
    });
    expect(result.current.favorites).toEqual([]);

    act(() => {
      switchProfile(null);
    });
    expect(result.current.favorites.map((a) => a.mal_id)).toEqual([1]);
  });

  it("guarda o status de cada anime na lista do perfil", () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => {
      createProfile("Ana", "🦊");
    });
    act(() => result.current.setStatus(makeAnime(5, { title: "Frieren" }), "watching"));
    expect(result.current.statusOf(5)).toBe("watching");

    act(() => result.current.setStatus(makeAnime(5), "completed"));
    expect(result.current.statusOf(5)).toBe("completed");
    expect(result.current.entries).toHaveLength(1);

    act(() => result.current.setStatus(makeAnime(5), null));
    expect(result.current.statusOf(5)).toBeNull();

    act(() => {
      createProfile("Bia", "🐱");
    });
    expect(result.current.entries).toEqual([]);
  });

  it("excluir o perfil apaga os dados dele e volta para visitante", () => {
    const { result } = renderHook(() => useFavorites());
    let id = "";
    act(() => {
      id = createProfile("Ana", "🦊")!.id;
    });
    act(() => result.current.toggle(makeAnime(9)));
    expect(localStorage.getItem(`anidrx:favorites:${id}`)).not.toBeNull();

    act(() => deleteProfile(id));
    expect(localStorage.getItem(`anidrx:favorites:${id}`)).toBeNull();
    expect(result.current.favorites).toEqual([]);
  });

  it("ignora dados de perfis corrompidos", () => {
    localStorage.setItem("anidrx:profiles", "{lixo");
    reloadProfiles();
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });
});
