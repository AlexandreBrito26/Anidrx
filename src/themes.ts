export const THEMES = [
  { value: "light", label: "☀️ Dia" },
  { value: "dark", label: "🌙 Noite" },
  { value: "winter", label: "❄️ Inverno" },
  { value: "halloween", label: "🎃 Halloween" },
  { value: "autumn", label: "🍂 Outono" },
  { value: "spring", label: "🌸 Primavera" },
  { value: "matsuri", label: "🏮 Matsuri" },
  { value: "xmas", label: "🎄 Natal" },
  { value: "newyear", label: "🎆 Ano-novo" },
  { value: "cyber", label: "🌃 Cyberpunk" },
  { value: "galaxy", label: "🌌 Galáxia" },
  { value: "ocean", label: "🌊 Oceano" },
  { value: "manga", label: "📖 Mangá" },
] as const;

export type Theme = (typeof THEMES)[number]["value"];

export const isTheme = (v: unknown): v is Theme => THEMES.some((t) => t.value === v);

/** Cor da barra do navegador no celular. */
export const BAR_COLOR: Record<Theme, string> = {
  light: "#d9480f",
  dark: "#17142a",
  winter: "#2b73c4",
  halloween: "#1a0f1f",
  autumn: "#b8441a",
  spring: "#c2255c",
  matsuri: "#12192e",
  xmas: "#0f2a1f",
  newyear: "#0c0b16",
  cyber: "#0a0614",
  galaxy: "#0b0720",
  ocean: "#05202e",
  manga: "#111111",
};

/** A logo muda de cor com o tema (e o favicon acompanha). */
export const LOGO: Record<Theme, { tile: string; a: string; bar: string; spark: string }> = {
  light: { tile: "#0b86b3", a: "#ffffff", bar: "#ffd23f", spark: "#ff9f1c" },
  dark: { tile: "#1b1633", a: "#ffffff", bar: "#ff6b92", spark: "#ffcf5c" },
  winter: { tile: "#2b73c4", a: "#ffffff", bar: "#bfe3ff", spark: "#ffffff" },
  halloween: { tile: "#2a1733", a: "#ffe9d2", bar: "#ff7a1a", spark: "#8bd450" },
  autumn: { tile: "#8f3212", a: "#fff3dc", bar: "#f2a93b", spark: "#ffd27a" },
  spring: { tile: "#c2255c", a: "#ffffff", bar: "#ffd6e5", spark: "#ffe066" },
  matsuri: { tile: "#b3262a", a: "#fff1dc", bar: "#ffd34d", spark: "#ffd34d" },
  xmas: { tile: "#b3261e", a: "#ffffff", bar: "#2f9e5e", spark: "#ffd166" },
  newyear: { tile: "#1a1830", a: "#fff8e1", bar: "#ffc83d", spark: "#ffc83d" },
  cyber: { tile: "#14001f", a: "#52f1ff", bar: "#ff2e97", spark: "#f5e663" },
  galaxy: { tile: "#1a1240", a: "#ffffff", bar: "#b388ff", spark: "#80d8ff" },
  ocean: { tile: "#0b6f93", a: "#ffffff", bar: "#ff8a5c", spark: "#9ff3ff" },
  manga: { tile: "#111111", a: "#ffffff", bar: "#e10600", spark: "#ffffff" },
};

/** Textos com a voz de cada tema. No tema Dia ficam os textos originais. */
export const COPY: Record<Theme, { popular: string; tagline: string }> = {
  light: { popular: "Mais populares agora", tagline: "Anime de verão, direto da praia" },
  dark: { popular: "Mais populares da madrugada", tagline: "Maratona de madrugada" },
  winter: { popular: "Mais populares para o frio", tagline: "Cobertor, chocolate quente e anime" },
  halloween: { popular: "Mais populares da noite das bruxas", tagline: "Histórias para a noite das bruxas" },
  autumn: { popular: "Mais populares do outono", tagline: "Folhas caindo, chá quente e anime" },
  spring: { popular: "Mais populares da primavera", tagline: "Sakura, piquenique e anime" },
  matsuri: { popular: "Mais populares do festival", tagline: "Fogos, lanternas e uma noite de verão" },
  xmas: { popular: "Mais populares do Natal", tagline: "Neve, luzes e maratona de anime" },
  newyear: { popular: "Mais populares do ano", tagline: "Um novo ano, uma nova maratona" },
  cyber: { popular: "Mais populares da rede", tagline: "Neon, chuva e anime até o amanhecer" },
  galaxy: { popular: "Mais populares da galáxia", tagline: "Explorando mundos de anime" },
  ocean: { popular: "Mais populares do fundo do mar", tagline: "Mergulhe num mar de animes" },
  manga: { popular: "Mais populares da semana", tagline: "Capítulo novo toda semana" },
};

export function faviconFor(theme: Theme): string {
  const c = LOGO[theme];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${c.tile}"/>` +
    `<path d="M132 392 L256 118 L380 392" fill="none" stroke="${c.a}" stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M192 320 H320" stroke="${c.bar}" stroke-width="44" stroke-linecap="round"/>` +
    `<path d="M404 54 Q414 112 472 122 Q414 132 404 190 Q394 132 336 122 Q394 112 404 54Z" fill="${c.spark}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
