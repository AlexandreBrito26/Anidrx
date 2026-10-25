// Tradução automática (inglês → português do Brasil) das sinopses, feita direto do navegador.
// O app é uma SPA estática, sem back-end: usamos endpoints públicos e sem chave, com um segundo
// provedor de reserva. Para trocar de serviço (DeepL, função serverless na Vercel…), basta
// adicionar um item em PROVIDERS. O resultado fica em cache no localStorage.

export interface Provider {
  name: string;
  /** Tamanho máximo, em caracteres, de cada pedaço enviado ao serviço. */
  maxChars: number;
  translate: (text: string, signal?: AbortSignal) => Promise<string>;
}

const CACHE_KEY = "anidrx:translations:v1";
const CACHE_LIMIT = 150;

// ---- Provedores --------------------------------------------------------------------------

const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

// Endpoint público do Google Tradutor (não documentado; pode mudar ou limitar sem aviso).
const google: Provider = {
  name: "google",
  maxChars: 1000,
  async translate(text, signal) {
    const params = new URLSearchParams({ client: "gtx", sl: "en", tl: "pt", dt: "t", q: text });
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, { signal });
    if (!res.ok) throw new Error(`google: HTTP ${res.status}`);
    const data: unknown = await res.json();
    const parts = Array.isArray(data) && Array.isArray(data[0]) ? (data[0] as unknown[]) : null;
    if (!parts) throw new Error("google: resposta inesperada");
    const out = parts.map((p) => (Array.isArray(p) && typeof p[0] === "string" ? p[0] : "")).join("");
    if (!out.trim()) throw new Error("google: resposta vazia");
    return out;
  },
};

// MyMemory: API pública e documentada, mas com limite diário e pedidos de até 500 bytes.
const myMemory: Provider = {
  name: "mymemory",
  maxChars: 400,
  async translate(text, signal) {
    const params = new URLSearchParams({ q: text, langpair: "en|pt-BR" });
    const res = await fetch(`https://api.mymemory.translated.net/get?${params}`, { signal });
    if (!res.ok) throw new Error(`mymemory: HTTP ${res.status}`);
    const data = (await res.json()) as { responseStatus?: number | string; responseData?: { translatedText?: unknown } };
    const out = data?.responseData?.translatedText;
    if (Number(data?.responseStatus) !== 200 || typeof out !== "string" || !out.trim() || /MYMEMORY WARNING/i.test(out)) {
      throw new Error("mymemory: sem tradução");
    }
    return decodeEntities(out);
  },
};

export const PROVIDERS: Provider[] = [google, myMemory];

// ---- Divisão do texto em pedaços ----------------------------------------------------------

// Parte uma frase grande demais em pedaços de até `max`, sempre em espaços.
function hardSplit(s: string, max: number): string[] {
  const out: string[] = [];
  let rest = s.trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf(" ", max);
    if (cut <= 0) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/** Uma lista de pedaços (≤ max) por linha do texto; linhas vazias viram lista vazia. */
export function chunkText(text: string, max: number): string[][] {
  return text.split("\n").map((line) => {
    if (!line.trim()) return [];
    // Cada frase começa num caractere visível, vai até a pontuação final e leva o espaço depois dela.
    const sentences = line.match(/\S[^.!?…]*(?:[.!?…]+["')\]]*)?\s*/g) ?? [line];
    const chunks: string[] = [];
    let current = "";
    for (const sentence of sentences.flatMap((s) => (s.length > max ? hardSplit(s, max) : [s]))) {
      if (current && current.length + sentence.length > max) {
        chunks.push(current.trim());
        current = "";
      }
      current += sentence;
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  });
}

// ---- Cache --------------------------------------------------------------------------------

type Cache = Record<string, { t: string; at: number }>;
let memory: Cache | null = null;

const keyOf = (text: string) => {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}:${(h >>> 0).toString(36)}`;
};

function cache(): Cache {
  if (memory) return memory;
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
    memory = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Cache) : {};
  } catch {
    memory = {};
  }
  return memory;
}

function remember(text: string, translated: string) {
  const c = cache();
  c[keyOf(text)] = { t: translated, at: Date.now() };
  const keys = Object.keys(c);
  if (keys.length > CACHE_LIMIT) {
    keys.sort((a, b) => c[a].at - c[b].at).slice(0, keys.length - CACHE_LIMIT).forEach((k) => delete c[k]);
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* armazenamento cheio ou indisponível: segue só com o cache em memória */
  }
}

/** Tradução já guardada (ou null). Síncrono, para a tela não piscar em inglês. */
export function getCachedTranslation(text: string): string | null {
  const hit = cache()[keyOf(text)];
  return typeof hit?.t === "string" ? hit.t : null;
}

// ---- Tradução -----------------------------------------------------------------------------

async function translateWith(provider: Provider, text: string, signal?: AbortSignal): Promise<string> {
  const lines = chunkText(text, provider.maxChars);
  const jobs = lines.flat();
  const done: string[] = new Array(jobs.length);
  let next = 0;
  // No máximo 3 pedidos ao mesmo tempo, para não estourar o limite do serviço.
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      done[i] = (await provider.translate(jobs[i], signal)).trim();
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, jobs.length) }, worker));

  let n = 0;
  return lines.map((chunks) => chunks.map(() => done[n++]).join(" ")).join("\n");
}

export async function translateToPt(
  text: string,
  opts: { signal?: AbortSignal; providers?: Provider[] } = {}
): Promise<string> {
  const cached = getCachedTranslation(text);
  if (cached !== null) return cached;

  let lastError: unknown = new Error("Nenhum provedor de tradução configurado");
  for (const provider of opts.providers ?? PROVIDERS) {
    try {
      const out = await translateWith(provider, text, opts.signal);
      if (!out.trim()) throw new Error(`${provider.name}: tradução vazia`);
      remember(text, out);
      return out;
    } catch (e) {
      if (opts.signal?.aborted) throw e;
      lastError = e;
    }
  }
  throw lastError;
}
