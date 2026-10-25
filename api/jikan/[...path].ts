// Proxy da Jikan: o celular fala só com o próprio domínio do app e é a Vercel que consulta
// a Jikan. Evita bloqueio de rede/CORS no aparelho e permite cache compartilhado.
//
// Usa o formato clássico (req, res) da Vercel, o mais compatível com qualquer versão do runtime.
const UPSTREAM = "https://api.jikan.moe";
const ATTEMPTS = 2;
const TIMEOUT_MS = 4500; // cabe no limite de 10s das funções do plano gratuito

// Tipos mínimos do que usamos de req/res (evita depender de @vercel/node só para tipos).
interface Req {
  url?: string;
  method?: string;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  send(body: unknown): void;
}

const fail = (res: Res, status: number, message: string) => {
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.status(status).send(JSON.stringify({ status, message }));
};

export default async function handler(req: Req, res: Res): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const target = url.pathname.replace(/^\/api\/jikan/, "");
  // Só repassa a API v4 da Jikan; nada de usar o proxy para outros destinos.
  if (!target.startsWith("/v4/")) return fail(res, 400, "Caminho inválido.");

  let lastStatus: number | undefined;
  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      const up = await fetch(`${UPSTREAM}${target}${url.search}`, {
        headers: { accept: "application/json", "user-agent": "anidrx-proxy" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (up.ok) {
        res.setHeader("content-type", "application/json");
        // 10 min no CDN; se a Jikan cair, serve a cópia antiga por até 1 dia.
        res.setHeader(
          "cache-control",
          "public, max-age=0, s-maxage=600, stale-while-revalidate=86400, stale-if-error=86400"
        );
        res.status(200).send(await up.text());
        return;
      }
      lastStatus = up.status;
      // 4xx (exceto 429) é erro do pedido: repetir não adianta.
      if (up.status !== 429 && up.status < 500) break;
    } catch {
      lastStatus = undefined;
    }
  }

  if (lastStatus !== undefined) {
    return fail(res, lastStatus === 429 ? 429 : lastStatus === 404 ? 404 : 502, "Erro na Jikan.");
  }
  return fail(res, 504, "A Jikan demorou demais para responder.");
}
