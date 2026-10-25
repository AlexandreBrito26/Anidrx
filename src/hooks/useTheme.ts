import { useEffect, useSyncExternalStore } from "react";

import { rememberTheme } from "../profiles";
import { BAR_COLOR, faviconFor, isTheme, THEMES } from "../themes";
import type { Theme } from "../themes";

export { THEMES };
export type { Theme };

const KEY = "anidrx:theme";

function read(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (isTheme(saved)) return saved;
  } catch {
    /* armazenamento indisponível */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// O tema é um só para o app inteiro: o seletor, as páginas e o fundo animado leem o mesmo valor.
let current: Theme | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  if (current === null) current = read();
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setTheme(next: Theme) {
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignora */
  }
  rememberTheme(next); // se há um perfil ativo, o tema fica salvo nele
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR_COLOR[theme]);
    document.querySelector('link[rel="icon"]')?.setAttribute("href", faviconFor(theme));
  }, [theme]);

  return { theme, setTheme };
}
