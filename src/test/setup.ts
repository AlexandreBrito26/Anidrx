import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

// A tradução das sinopses usa a rede. Nos testes ela devolve o texto como veio (sem tradução),
// a menos que o teste configure outra resposta; translate.test.ts carrega o módulo de verdade.
vi.mock("../translate", () => ({
  getCachedTranslation: vi.fn(() => null),
  translateToPt: vi.fn(async (text: string) => text),
}));

// jsdom não implementa matchMedia (usado por useTheme e pelo scroll da Home).
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
