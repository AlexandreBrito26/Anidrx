import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Theme } from "../hooks/useTheme";

// Gerador determinístico: a cena é a mesma a cada visita.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const vars = (v: Record<string, string>) => v as CSSProperties;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function Dots({ count }: { count: number }) {
  const dots = useMemo(
    () =>
      range(count).map((i) => vars({
        left: `${rand(i + 1) * 100}%`,
        top: `${rand(i + 101) * 100}%`,
        width: `${1 + Math.floor(rand(i + 201) * 3)}px`,
        "--twinkle": `${2.5 + rand(i + 301) * 4}s`,
        "--delay": `${-rand(i + 401) * 8}s`,
      })),
    [count]
  );
  return <>{dots.map((s, i) => <span key={i} className="sky__dot" style={s} />)}</>;
}

/** Noite: estrelinhas que cintilam, faíscas que giram e estrelas cadentes. */
function Night() {
  const sparkles = useMemo(
    () =>
      range(8).map((i) => vars({
        left: `${5 + rand(i + 501) * 90}%`,
        top: `${5 + rand(i + 601) * 85}%`,
        width: `${12 + rand(i + 701) * 16}px`,
        "--spin": `${26 + rand(i + 801) * 30}s`,
        "--twinkle": `${3 + rand(i + 901) * 3}s`,
        "--delay": `${-rand(i + 1001) * 20}s`,
      })),
    []
  );
  const meteors = useMemo(
    () =>
      range(6).map((i) => vars({
        left: `${35 + rand(i + 1101) * 70}%`,
        top: `${-5 + rand(i + 1201) * 40}%`,
        "--fall": `${8 + rand(i + 1301) * 8}s`,
        "--delay": `${-rand(i + 1401) * 14}s`,
      })),
    []
  );
  return (
    <>
      <Dots count={70} />
      {sparkles.map((s, i) => (
        <svg key={i} className="sky__sparkle" viewBox="0 0 100 100" style={s}>
          <path d="M50 0 Q54 46 100 50 Q54 54 50 100 Q46 54 0 50 Q46 46 50 0Z" />
        </svg>
      ))}
      {meteors.map((s, i) => <span key={i} className="sky__meteor" style={s} />)}
    </>
  );
}

/** Dia de praia: sol com raios girando, nuvens à deriva e ondas no rodapé. */
function Day() {
  const clouds = useMemo(
    () =>
      range(4).map((i) => vars({
        "--y": `${8 + rand(i + 1501) * 38}%`,
        "--drift": `${70 + rand(i + 1601) * 60}s`,
        "--delay": `${-rand(i + 1701) * 90}s`,
        "--s": `${0.7 + rand(i + 1801) * 0.7}`,
      })),
    []
  );
  const wave = "M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 V120 H0Z";
  return (
    <>
      <div className="sun">
        <div className="sun__rays" />
        <div className="sun__core" />
      </div>
      {clouds.map((s, i) => <span key={i} className="cloud" style={s} />)}
      <svg className="wave wave--back" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d={wave} /></svg>
      <svg className="wave wave--front" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d={wave} /></svg>
    </>
  );
}

/** Inverno: neve caindo, alguns flocos grandes girando e o chão nevado. */
function Winter() {
  const flakes = useMemo(
    () =>
      range(70).map((i) => ({
        big: i % 11 === 0,
        style: vars({
          left: `${rand(i + 1901) * 100}%`,
          "--size": `${3 + rand(i + 2001) * 6}px`,
          "--fall": `${9 + rand(i + 2101) * 12}s`,
          "--delay": `${-rand(i + 2201) * 20}s`,
          "--sway": `${(rand(i + 2301) - 0.5) * 90}px`,
        }),
      })),
    []
  );
  return (
    <>
      {flakes.map((f, i) =>
        f.big
          ? <span key={i} className="flake flake--big" style={f.style}>❄</span>
          : <span key={i} className="flake" style={f.style} />
      )}
      <div className="snow-ground" />
    </>
  );
}

/** Halloween: lua laranja, morcegos voando, fantasmas subindo, abóboras e névoa. */
function Halloween() {
  const bats = useMemo(
    () =>
      range(6).map((i) => vars({
        top: `${4 + rand(i + 2401) * 50}%`,
        "--size": `${20 + rand(i + 2501) * 18}px`,
        "--fly": `${14 + rand(i + 2601) * 14}s`,
        "--delay": `${-rand(i + 2701) * 25}s`,
      })),
    []
  );
  const ghosts = useMemo(
    () =>
      range(3).map((i) => vars({
        left: `${10 + rand(i + 2801) * 75}%`,
        "--rise": `${22 + rand(i + 2901) * 14}s`,
        "--delay": `${-rand(i + 3001) * 30}s`,
      })),
    []
  );
  const pumpkinLeft = ["4%", "38%", "66%"];
  return (
    <>
      <Dots count={36} />
      <div className="moon" />
      {ghosts.map((s, i) => <span key={i} className="ghost" style={s}>👻</span>)}
      {bats.map((s, i) => (
        <span key={i} className="bat" style={s}><span className="bat__body">🦇</span></span>
      ))}
      <div className="fog" />
      {pumpkinLeft.map((left, i) => (
        <span key={i} className="pumpkin" style={vars({ left, "--delay": `${-i * 0.9}s` })}>🎃</span>
      ))}
    </>
  );
}

/** Outono: folhas caindo e girando, luz dourada ao fundo e um tapete de folhas no chão. */
function Autumn() {
  const leaves = useMemo(
    () =>
      range(26).map((i) => ({
        glyph: i % 3 === 0 ? "🍂" : "🍁",
        style: vars({
          left: `${rand(i + 3101) * 100}%`,
          "--size": `${16 + rand(i + 3201) * 20}px`,
          "--fall": `${12 + rand(i + 3301) * 12}s`,
          "--delay": `${-rand(i + 3401) * 24}s`,
          "--sway": `${(rand(i + 3501) - 0.5) * 160}px`,
          "--spin": `${6 + rand(i + 3601) * 8}s`,
        }),
      })),
    []
  );
  return (
    <>
      <div className="golden-glow" />
      {leaves.map((l, i) => <span key={i} className="leaf" style={l.style}>{l.glyph}</span>)}
      <div className="leaf-ground" />
    </>
  );
}

/** Neve: flocos caindo (usada no Natal). */
function Flakes({ count }: { count: number }) {
  const flakes = useMemo(
    () =>
      range(count).map((i) => vars({
        left: `${rand(i + 4001) * 100}%`,
        "--size": `${3 + rand(i + 4101) * 6}px`,
        "--fall": `${9 + rand(i + 4201) * 12}s`,
        "--delay": `${-rand(i + 4301) * 20}s`,
        "--sway": `${(rand(i + 4401) - 0.5) * 90}px`,
      })),
    [count]
  );
  return <>{flakes.map((st, i) => <span key={i} className="flake" style={st} />)}</>;
}

/** Fogos de artifício: anéis que se abrem e somem. */
function Fireworks({ colors, count }: { colors: string[]; count: number }) {
  const bursts = useMemo(
    () =>
      range(count).map((i) => vars({
        left: `${10 + rand(i + 4501) * 80}%`,
        top: `${8 + rand(i + 4601) * 42}%`,
        "--size": `${130 + rand(i + 4701) * 110}px`,
        "--c": colors[i % colors.length],
        "--cycle": `${5 + rand(i + 4801) * 5}s`,
        "--delay": `${-rand(i + 4901) * 10}s`,
      })),
    [count, colors]
  );
  return <>{bursts.map((st, i) => <span key={i} className="firework" style={st} />)}</>;
}

function Meteors({ count }: { count: number }) {
  const meteors = useMemo(
    () =>
      range(count).map((i) => vars({
        left: `${35 + rand(i + 5001) * 70}%`,
        top: `${-5 + rand(i + 5101) * 40}%`,
        "--fall": `${8 + rand(i + 5201) * 8}s`,
        "--delay": `${-rand(i + 5301) * 14}s`,
      })),
    [count]
  );
  return <>{meteors.map((st, i) => <span key={i} className="sky__meteor" style={st} />)}</>;
}

/** Primavera: pétalas de sakura caindo e colinas verdes. */
function Spring() {
  const petals = useMemo(
    () =>
      range(34).map((i) => vars({
        left: `${rand(i + 5401) * 100}%`,
        "--size": `${9 + rand(i + 5501) * 12}px`,
        "--fall": `${10 + rand(i + 5601) * 10}s`,
        "--delay": `${-rand(i + 5701) * 20}s`,
        "--sway": `${(rand(i + 5801) - 0.5) * 200}px`,
        "--spin": `${5 + rand(i + 5901) * 7}s`,
      })),
    []
  );
  return (
    <>
      <div className="hill hill--far" />
      <div className="hill hill--near" />
      {petals.map((st, i) => <span key={i} className="petal" style={st} />)}
    </>
  );
}

/** Matsuri: lanternas balançando, fogos de artifício e vaga-lumes. */
function Matsuri() {
  const lanterns = useMemo(
    () => range(7).map((i) => vars({ left: `${6 + i * 14.5}%`, "--delay": `${-i * 0.7}s`, "--s": `${30 + (i % 3) * 6}px` })),
    []
  );
  const flies = useMemo(
    () =>
      range(18).map((i) => vars({
        left: `${rand(i + 6001) * 100}%`,
        top: `${40 + rand(i + 6101) * 55}%`,
        "--float": `${7 + rand(i + 6201) * 8}s`,
        "--delay": `${-rand(i + 6301) * 12}s`,
        "--dx": `${(rand(i + 6401) - 0.5) * 120}px`,
      })),
    []
  );
  return (
    <>
      <Dots count={30} />
      <Fireworks count={5} colors={["#ff5a4d", "#ffd34d", "#ff9ec7", "#7fe3ff"]} />
      <div className="wire" />
      {lanterns.map((st, i) => <span key={i} className="lantern" style={st}>🏮</span>)}
      {flies.map((st, i) => <span key={i} className="firefly" style={st} />)}
    </>
  );
}

/** Natal: luzes piscando no topo, neve e árvores no chão. */
function Xmas() {
  const colors = ["#ff5964", "#ffd166", "#4cd68a", "#6ec6ff"];
  const bulbs = useMemo(
    () =>
      range(17).map((i) => vars({
        left: `${(i / 16) * 100}%`,
        top: `${6 + Math.abs(Math.sin((i * Math.PI) / 4)) * 16}px`,
        "--c": colors[i % 4],
        "--delay": `${-(i % 4) * 0.5}s`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <>
      <Flakes count={46} />
      <div className="snow-ground" />
      <div className="wire" />
      {bulbs.map((st, i) => <span key={i} className="bulb" style={st} />)}
      {["4%", "36%", "70%"].map((left, i) => (
        <span key={i} className="deco" style={vars({ left, "--glow": "rgba(76, 214, 138, 0.55)", "--delay": `${-i * 0.8}s` })}>
          {i === 1 ? "🎁" : "🎄"}
        </span>
      ))}
    </>
  );
}

/** Ano-novo: muitos fogos dourados e confete. */
function NewYear() {
  const confetti = useMemo(
    () =>
      range(40).map((i) => vars({
        left: `${rand(i + 6501) * 100}%`,
        "--size": `${5 + rand(i + 6601) * 6}px`,
        "--fall": `${7 + rand(i + 6701) * 8}s`,
        "--delay": `${-rand(i + 6801) * 15}s`,
        "--sway": `${(rand(i + 6901) - 0.5) * 120}px`,
        "--spin": `${2 + rand(i + 7001) * 3}s`,
        "--c": ["#ffc83d", "#ff6b92", "#7fe3ff", "#ffffff"][i % 4],
      })),
    []
  );
  return (
    <>
      <Dots count={50} />
      <Fireworks count={8} colors={["#ffc83d", "#fff8e1", "#ff6b92", "#7fe3ff"]} />
      {confetti.map((st, i) => <span key={i} className="confetti" style={st} />)}
    </>
  );
}

/** Cyberpunk: sol sintético, chão em grade, chuva de neon e linhas de varredura. */
function Cyber() {
  const drops = useMemo(
    () =>
      range(36).map((i) => vars({
        left: `${rand(i + 7101) * 100}%`,
        "--h": `${40 + rand(i + 7201) * 80}px`,
        "--fall": `${1.4 + rand(i + 7301) * 1.6}s`,
        "--delay": `${-rand(i + 7401) * 3}s`,
        "--c": i % 2 ? "#52f1ff" : "#ff2e97",
      })),
    []
  );
  return (
    <>
      <div className="synth-sun" />
      <div className="grid-floor" />
      {drops.map((st, i) => <span key={i} className="drop" style={st} />)}
    </>
  );
}

/** Galáxia: estrelas, nebulosas à deriva, planeta com anel, foguete e estrelas cadentes. */
function Galaxy() {
  return (
    <>
      <Dots count={90} />
      <span className="nebula" style={vars({ left: "-10%", top: "10%", "--c": "rgba(179,136,255,.38)", "--s": "360px" })} />
      <span className="nebula" style={vars({ right: "-15%", top: "45%", "--c": "rgba(128,216,255,.28)", "--s": "420px", "--delay": "-6s" })} />
      <span className="nebula" style={vars({ left: "20%", bottom: "-12%", "--c": "rgba(255,110,199,.26)", "--s": "380px", "--delay": "-11s" })} />
      <div className="planet"><span className="planet__ring" /></div>
      <span className="rocket">🚀</span>
      <Meteors count={4} />
    </>
  );
}

/** Oceano: raios de luz, bolhas subindo, peixes nadando e o fundo do mar. */
function Ocean() {
  const bubbles = useMemo(
    () =>
      range(30).map((i) => vars({
        left: `${rand(i + 7501) * 100}%`,
        "--size": `${5 + rand(i + 7601) * 16}px`,
        "--rise": `${8 + rand(i + 7701) * 10}s`,
        "--delay": `${-rand(i + 7801) * 18}s`,
        "--sway": `${(rand(i + 7901) - 0.5) * 60}px`,
      })),
    []
  );
  const fish = useMemo(
    () =>
      range(6).map((i) => ({
        glyph: ["🐠", "🐟", "🐡"][i % 3],
        style: vars({
          top: `${15 + rand(i + 8001) * 60}%`,
          "--size": `${22 + rand(i + 8101) * 20}px`,
          "--swim": `${16 + rand(i + 8201) * 16}s`,
          "--delay": `${-rand(i + 8301) * 28}s`,
        }),
      })),
    []
  );
  return (
    <>
      {range(5).map((i) => (
        <span key={i} className="ray" style={vars({ left: `${8 + i * 20}%`, "--w": `${60 + (i % 3) * 40}px`, "--delay": `${-i * 1.6}s` })} />
      ))}
      {bubbles.map((st, i) => <span key={i} className="bubble" style={st} />)}
      {fish.map((f, i) => (
        <span key={i} className="fish" style={f.style}><span className="fish__body">{f.glyph}</span></span>
      ))}
      <div className="seabed" />
      <span className="deco" style={vars({ left: "8%", "--glow": "rgba(255, 138, 92, 0.5)" })}>🐚</span>
      <span className="deco" style={vars({ left: "55%", "--glow": "rgba(255, 138, 92, 0.5)", "--delay": "-1.4s" })}>🐙</span>
    </>
  );
}

/** Mangá: retícula, linhas de velocidade e onomatopeias que aparecem de repente. */
function Manga() {
  const sfx = useMemo(
    () =>
      ["ZUM!", "BAM!", "POW!", "DON!", "ZAP!"].map((word, i) => ({
        word,
        style: vars({
          left: `${6 + rand(i + 8401) * 62}%`,
          top: `${10 + rand(i + 8501) * 70}%`,
          "--cycle": `${9 + rand(i + 8601) * 6}s`,
          "--delay": `${-rand(i + 8701) * 14}s`,
          "--rot": `${-14 + rand(i + 8801) * 28}deg`,
          "--size": `${34 + rand(i + 8901) * 30}px`,
        }),
      })),
    []
  );
  return (
    <>
      <div className="speedlines" />
      <div className="halftone halftone--a" />
      <div className="halftone halftone--b" />
      {sfx.map((f, i) => <span key={i} className={`sfx${i % 3 === 0 ? " sfx--red" : ""}`} style={f.style}>{f.word}</span>)}
    </>
  );
}

const SCENES: Record<Theme, () => JSX.Element> = {
  light: Day,
  dark: Night,
  winter: Winter,
  halloween: Halloween,
  autumn: Autumn,
  spring: Spring,
  matsuri: Matsuri,
  xmas: Xmas,
  newyear: NewYear,
  cyber: Cyber,
  galaxy: Galaxy,
  ocean: Ocean,
  manga: Manga,
};

export function Scene({ theme }: { theme: Theme }) {
  const Body = SCENES[theme];
  return (
    <div className={`scene scene--${theme}`} aria-hidden="true">
      <Body />
    </div>
  );
}

export function EffectsToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className={`fx-toggle${on ? " is-on" : ""}`}
      onClick={onToggle}
      aria-pressed={on}
      aria-label="Efeitos de fundo"
      title={on ? "Desligar efeitos" : "Ligar efeitos"}
    >
      <span aria-hidden="true">✦</span>
      <span className="fx-toggle__label">{on ? "Efeitos ligados" : "Efeitos desligados"}</span>
    </button>
  );
}
