# Anidrx

Buscador de animes feito com React, TypeScript, Vite e Sass. Os dados vêm da API pública [AniList](https://anilist.co) (GraphQL), chamada direto do navegador, sem chave e sem back-end.

## Recursos
- Busca com debounce e cancelamento de requisições
- Filtros por tipo (série, filme, OVA…) e gênero, com ordenação por popularidade, nota, data ou A–Z
- Busca, filtros e página na URL (link compartilhável): `/?q=frieren&genre=10&page=2`
- Cache de buscas com React Query
- Detalhes em modal: capa, sinopse, estúdio, temporada, ranking e trailer
- Sinopse traduzida automaticamente para português (com botão "Ver original"); gêneros, status, formato e origem também em português
- Página própria por anime (`/anime/:id`) com link compartilhável, "Onde assistir", lista de episódios e "Parecidos com este"
- Favoritos e "Minha lista" (quero ver, assistindo, concluído) salvos no navegador, com contador de episódios vistos
- Sequências, prequelas e outras obras relacionadas na página de cada anime, com atalho "Continuar"
- Tema claro e escuro
- PWA: instalável no celular/computador e com suporte offline (favoritos e capas já vistas)
- 13 temas que mudam o site inteiro (Dia, Noite, Inverno, Halloween, Outono, Primavera, Matsuri, Natal, Ano-novo, Cyberpunk, Galáxia, Oceano e Mangá: paleta, fontes, formas, logo, favicon, textos e fundo animado) com botão para ligar/desligar os efeitos
- Logo própria (A com faísca), busca fixa no topo e ajustes de toque para celular
- Página "Temporada" (/temporada), "Surpreenda-me" (anime aleatório) e botão de compartilhar
- Skeletons de carregamento, atalho `/` para buscar e navegação por teclado

## Rodar
```bash
npm install
npm run dev
```

## Scripts
| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checagem de tipos e build de produção |
| `npm run preview` | serve o build localmente |
| `npm test` | roda os testes uma vez (API, hooks, componentes e páginas) |
| `npm run test:watch` | testes em modo observação |

## PWA
O service worker só é gerado no build de produção. Para testar:
```bash
npm run build
npm run preview
```
Abra o endereço mostrado (funciona em `localhost` ou HTTPS), e o navegador oferecerá "Instalar". Para ver o modo offline, abra o DevTools → Application → Service Workers → Offline.

- Capas ficam em cache por até 30 dias.
- Favoritos e tema já ficam no armazenamento do navegador, então funcionam sem rede.
- Ícones em `public/`: `pwa-192.png`, `pwa-512.png`, `maskable-512.png`, `apple-touch-icon.png`.

## Estrutura
```
src/
  api.ts              consultas à AniList, filtros e listas de gêneros/tipos
  storage.ts          armazenamento de favoritos e lista (IndexedDB, com alternativa em localStorage)
  pt.ts               rótulos em português (gêneros, status, formato, origem)
  translate.ts        tradução automática das sinopses (provedores públicos + cache)
  App.tsx             rotas
  pages/              Home (busca) e AnimePage (detalhe + parecidos)
  components/         AnimeCard, AnimeModal, SkeletonCard
  hooks/              useDebounce, useFavorites, useTheme
  styles/main.scss    estilos e temas (variáveis CSS)
  test/               setup e dados de teste
```

## Armazenamento dos dados
Favoritos e "Minha lista" ficam no **IndexedDB** do navegador (sem servidor), por perfil:
- Ao abrir o app, tudo é carregado para a memória; depois disso ler é instantâneo e cada alteração é gravada em seguida.
- Quem já tinha dados no `localStorage` é migrado automaticamente: o app grava no IndexedDB, confirma e só então apaga a cópia antiga.
- Se o IndexedDB não estiver disponível (ou falhar ao gravar), os dados continuam no `localStorage`, sem perda.
- O app pede ao navegador armazenamento persistente (`navigator.storage.persist()`), para ele não apagar os dados quando faltar espaço.
- Abas abertas ao mesmo tempo se mantêm sincronizadas (`BroadcastChannel`).
- Perfis, tema e cache de tradução continuam no `localStorage` (são pequenos e precisam existir antes da tela abrir).

Os dados ficam só neste navegador e neste aparelho. Para levar para outro lugar seria preciso exportar/importar ou um servidor.

## Deploy
O projeto é uma SPA estática. Na Vercel ou na Netlify, conecte o repositório e use:
- **Build command:** `npm run build`
- **Output directory:** `dist`

`vercel.json` e `public/_redirects` já redirecionam qualquer rota para o `index.html`.

## Observações sobre a API
A AniList limita a cerca de 90 requisições por minuto. O debounce e o cache reduzem as chamadas, mas buscas muito rápidas podem retornar erro 429; o app mostra uma mensagem e basta esperar um instante.

Dados e imagens pertencem aos respectivos detentores. Projeto sem fins comerciais.
