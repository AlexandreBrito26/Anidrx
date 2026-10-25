import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFavorites } from "./hooks/useFavorites";
import { useWatchlist } from "./hooks/useWatchlist";
import {
  flushStorage,
  getItem,
  initStorage,
  removeItem,
  resetStorageForTests,
  setItem,
  storageMode,
} from "./storage";
import { makeAnime } from "./test/fixtures";

const g = globalThis as unknown as { indexedDB: unknown };

// Fechar e abrir o navegador de novo: zera a memória do módulo, mas o banco continua.
async function restart() {
  await flushStorage();
  resetStorageForTests();
  await initStorage();
}

describe("storage (IndexedDB)", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStorageForTests();
    g.indexedDB = new IDBFactory();
  });

  it("usa o IndexedDB e mantém os dados depois de reabrir", async () => {
    await initStorage();
    expect(storageMode()).toBe("indexeddb");

    setItem("anidrx:favorites", "[1]");
    expect(getItem("anidrx:favorites")).toBe("[1]");
    expect(localStorage.getItem("anidrx:favorites")).toBeNull();

    await restart();
    expect(getItem("anidrx:favorites")).toBe("[1]");
  });

  it("migra favoritos e lista do localStorage sem mexer no resto", async () => {
    localStorage.setItem("anidrx:favorites", "[1]");
    localStorage.setItem("anidrx:watchlist:abc", '{"x":1}');
    localStorage.setItem("anidrx:profiles", "perfis");
    localStorage.setItem("anidrx:theme", "dark");

    await initStorage();
    expect(getItem("anidrx:favorites")).toBe("[1]");
    expect(getItem("anidrx:watchlist:abc")).toBe('{"x":1}');
    expect(localStorage.getItem("anidrx:favorites")).toBeNull();
    expect(localStorage.getItem("anidrx:watchlist:abc")).toBeNull();
    expect(localStorage.getItem("anidrx:profiles")).toBe("perfis");
    expect(localStorage.getItem("anidrx:theme")).toBe("dark");

    await restart(); // agora os dados vêm do próprio IndexedDB
    expect(getItem("anidrx:favorites")).toBe("[1]");
    expect(getItem("anidrx:watchlist:abc")).toBe('{"x":1}');
  });

  it("remove uma chave", async () => {
    await initStorage();
    setItem("anidrx:favorites:p1", "[1]");
    await flushStorage();
    removeItem("anidrx:favorites:p1");

    await restart();
    expect(getItem("anidrx:favorites:p1")).toBeNull();
  });

  it("guarda uma cópia no localStorage se o IndexedDB falhar, e migra na próxima abertura", async () => {
    await initStorage();
    const spy = vi.spyOn(IDBDatabase.prototype, "transaction").mockImplementationOnce(() => {
      throw new Error("sem espaço");
    });

    setItem("anidrx:favorites", "[2]");
    await flushStorage();
    spy.mockRestore();
    expect(localStorage.getItem("anidrx:favorites")).toBe("[2]");
    expect(getItem("anidrx:favorites")).toBe("[2]");

    await restart();
    expect(getItem("anidrx:favorites")).toBe("[2]");
    expect(localStorage.getItem("anidrx:favorites")).toBeNull();
  });

  it("favoritos e Minha lista sobrevivem a reabrir o app", async () => {
    await initStorage();
    const favs = renderHook(() => useFavorites());
    const list = renderHook(() => useWatchlist());
    act(() => favs.result.current.toggle(makeAnime(5)));
    act(() => list.result.current.setProgress(makeAnime(7, { episodes: 24 }), 10));
    favs.unmount();
    list.unmount();

    await restart();
    expect(renderHook(() => useFavorites()).result.current.isFavorite(5)).toBe(true);
    const again = renderHook(() => useWatchlist());
    expect(again.result.current.progressOf(7)).toBe(10);
    expect(again.result.current.statusOf(7)).toBe("watching");
  });
});

describe("storage (sem IndexedDB)", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStorageForTests();
  });

  it("segue no localStorage quando o navegador não tem IndexedDB", async () => {
    g.indexedDB = undefined;
    await initStorage();
    expect(storageMode()).toBe("localstorage");

    setItem("anidrx:favorites", "[3]");
    expect(localStorage.getItem("anidrx:favorites")).toBe("[3]");
    expect(getItem("anidrx:favorites")).toBe("[3]");
  });

  it("não perde nada quando o IndexedDB não abre", async () => {
    g.indexedDB = {
      open: () => {
        throw new Error("indisponível");
      },
    };
    localStorage.setItem("anidrx:favorites", "[4]");

    await initStorage();
    expect(storageMode()).toBe("localstorage");
    expect(getItem("anidrx:favorites")).toBe("[4]");
    expect(localStorage.getItem("anidrx:favorites")).toBe("[4]");
  });
});
