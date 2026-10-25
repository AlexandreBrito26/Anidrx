import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Provider } from "./translate";

// O setup troca o módulo por um mock; aqui queremos o de verdade, com cache limpo a cada teste.
async function load() {
  vi.resetModules();
  return vi.importActual<typeof import("./translate")>("./translate");
}

const provider = (name: string, fn: Provider["translate"], maxChars = 1000): Provider => ({
  name,
  maxChars,
  translate: fn,
});

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("chunkText", () => {
  it("respeita o tamanho máximo e não perde palavras", async () => {
    const { chunkText } = await load();
    const text = "First sentence here. Second one follows! Is a third? Yes, and a fourth one that is a bit longer.";
    const [chunks] = chunkText(text, 40);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(40);
    expect(chunks.join(" ")).toBe(text);
  });

  it("divide uma frase gigante em espaços e preserva as linhas", async () => {
    const { chunkText } = await load();
    const long = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
    const lines = chunkText(`${long}\n\nShort.`, 50);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toEqual([]);
    expect(lines[2]).toEqual(["Short."]);
    expect(lines[0].every((c) => c.length <= 50)).toBe(true);
    expect(lines[0].join(" ")).toBe(long);
  });

  it("não perde reticências no começo", async () => {
    const { chunkText } = await load();
    expect(chunkText("...And then it began.", 100)[0].join(" ")).toBe("...And then it began.");
  });
});

describe("translateToPt", () => {
  it("traduz por pedaços, mantém os parágrafos e guarda em cache", async () => {
    const { translateToPt, getCachedTranslation } = await load();
    const fn = vi.fn(async (t: string) => `PT(${t})`);
    const text = "Hello there. How are you?\n\nSecond paragraph.";

    const out = await translateToPt(text, { providers: [provider("a", fn)] });
    expect(out).toBe("PT(Hello there. How are you?)\n\nPT(Second paragraph.)");
    expect(getCachedTranslation(text)).toBe(out);

    const calls = fn.mock.calls.length;
    expect(await translateToPt(text, { providers: [provider("a", fn)] })).toBe(out);
    expect(fn.mock.calls.length).toBe(calls); // segunda vez veio do cache
  });

  it("cai para o provedor de reserva quando o primeiro falha", async () => {
    const { translateToPt } = await load();
    const bad = vi.fn(async () => {
      throw new Error("fora do ar");
    });
    const good = vi.fn(async (t: string) => `ok:${t}`);
    const out = await translateToPt("Hi.", { providers: [provider("bad", bad), provider("good", good)] });
    expect(out).toBe("ok:Hi.");
    expect(bad).toHaveBeenCalled();
  });

  it("falha (e não guarda nada) quando todos os provedores falham", async () => {
    const { translateToPt, getCachedTranslation } = await load();
    const bad = provider("bad", async () => {
      throw new Error("fora do ar");
    });
    await expect(translateToPt("Hi.", { providers: [bad, bad] })).rejects.toThrow("fora do ar");
    expect(getCachedTranslation("Hi.")).toBeNull();
  });

  it("propaga o cancelamento sem tentar o provedor seguinte", async () => {
    const { translateToPt } = await load();
    const ctrl = new AbortController();
    const first = provider("a", async () => {
      ctrl.abort();
      throw new DOMException("abortado", "AbortError");
    });
    const second = vi.fn(async (t: string) => t);
    await expect(
      translateToPt("Hi.", { signal: ctrl.signal, providers: [first, provider("b", second)] })
    ).rejects.toThrow();
    expect(second).not.toHaveBeenCalled();
  });
});

describe("provedores públicos", () => {
  it("Google: junta os trechos devolvidos", async () => {
    const { PROVIDERS } = await load();
    const body = [[["Olá, ", "Hello, ", null, null, 10], ["mundo.", "world.", null, null, 10]], null, "en"];
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => body })));
    expect(await PROVIDERS[0].translate("Hello, world.")).toBe("Olá, mundo.");
    const url = String((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(url).toContain("translate.googleapis.com");
    expect(url).toContain("tl=pt");
  });

  it("MyMemory: decodifica entidades e rejeita o aviso de cota", async () => {
    const { PROVIDERS } = await load();
    const reply = (translatedText: string, responseStatus = 200) =>
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ responseStatus, responseData: { translatedText } }) }));

    vi.stubGlobal("fetch", reply("Ele disse &quot;oi&quot; &amp; saiu&#39;"));
    expect(await PROVIDERS[1].translate("x")).toBe(`Ele disse "oi" & saiu'`);

    vi.stubGlobal("fetch", reply("MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY", 429));
    await expect(PROVIDERS[1].translate("x")).rejects.toThrow();
  });
});
