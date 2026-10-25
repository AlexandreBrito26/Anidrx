import { durationPt, sourcePt } from "../pt";
import type { Anime } from "../types";

const SEASONS: Record<string, string> = {
  winter: "Inverno",
  spring: "Primavera",
  summer: "Verão",
  fall: "Outono",
};

export default function AnimeFacts({ anime }: { anime: Anime }) {
  const season = anime.season
    ? `${SEASONS[anime.season] ?? anime.season} ${anime.year ?? ""}`.trim()
    : null;

  const facts: [string, string | null | undefined][] = [
    ["Estúdio", anime.studios?.map((s) => s.name).join(", ")],
    ["Temporada", season],
    ["Origem", sourcePt(anime.source)],
    ["Duração", durationPt(anime.duration)],
    ["Classificação", anime.rating],
    ["Ranking", anime.rank ? `#${anime.rank}` : null],
    ["Popularidade", anime.popularity ? `#${anime.popularity}` : null],
  ];

  return (
    <dl className="info">
      {facts.filter(([, v]) => v).map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
