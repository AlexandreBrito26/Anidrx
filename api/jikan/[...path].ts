// Proxy da Jikan: o celular fala só com o próprio domínio do app e é a Vercel que consulta
// a Jikan. Evita bloqueio de rede/CORS no aparelho e permite cache compartilhado.
const UPSTREAM = "https://api.jikan.moe";
const ATTEMPTS = 2;
const TIMEOUT_MS = 4500; // cabe no limite de 10s das funções do plano gratuito

const json = (status: number, message: string) =>
  new Response(JSON.stringify({ status, message }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = url.pathname.replace(/^\/api\/jikan/, "");
  // Só repassa a API v4 da Jikan; nada de usar o proxy para outros destinos.
  if (!target.startsWith("/v4/")) return json(400, "Caminho inválido.");

  let last: Response | undefined;
  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      const res = await fetch(`${UPSTREAM}${target}${url.search}`, {
        headers: { accept: "application/json", "user-agent": "anidrx-proxy" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) {
        return new Response(res.body, {
          status: 200,
          headers: {
            "content-type": "application/json",
            // 10 min no CDN; se a Jikan cair, serve a cópia antiga por até 1 dia.
            "cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400, stale-if-error=86400",
          },
        });
      }
      last = res;
      // 4xx (exceto 429) é erro do pedido: repetir não adianta.
      if (res.status !== 429 && res.status < 500) break;
    } catch {
      last = undefined;
    }
  }

  if (last) return json(last.status === 429 ? 429 : last.status === 404 ? 404 : 502, "Erro na Jikan.");
  return json(504, "A Jikan demorou demais para responder.");
}
