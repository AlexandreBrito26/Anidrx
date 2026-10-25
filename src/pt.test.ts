import { describe, expect, it } from "vitest";
import { durationPt, genrePt, sourcePt, statusPt, typePt } from "./pt";

describe("rótulos em português", () => {
  it("traduz gêneros da AniList e mantém os desconhecidos", () => {
    expect(genrePt("Slice of Life")).toBe("Cotidiano");
    expect(genrePt("Sci-Fi")).toBe("Ficção científica");
    expect(genrePt("Mahou Shoujo")).toBe("Garota mágica");
    expect(genrePt("Gênero Novo")).toBe("Gênero Novo");
  });

  it("traduz o status de exibição", () => {
    expect(statusPt("Finished Airing")).toBe("Finalizado");
    expect(statusPt("Currently Airing")).toBe("Em exibição");
    expect(statusPt("Not yet aired")).toBe("Ainda não exibido");
    expect(statusPt("On Hiatus")).toBe("Em hiato");
    expect(statusPt("Cancelled")).toBe("Cancelado");
  });

  it("é idempotente: texto que já está em português passa direto", () => {
    expect(genrePt("Ação")).toBe("Ação");
    expect(statusPt("Finalizado")).toBe("Finalizado");
    expect(durationPt("24 min por episódio")).toBe("24 min por episódio");
  });

  it("traduz formato, origem e duração", () => {
    expect(typePt("Movie")).toBe("Filme");
    expect(typePt("TV")).toBe("TV");
    expect(typePt(null)).toBeNull();
    expect(sourcePt("Light Novel")).toBe("Light novel");
    expect(sourcePt("Manga")).toBe("Mangá");
    expect(sourcePt(null)).toBeNull();
    expect(durationPt("24 min per ep")).toBe("24 min por episódio");
    expect(durationPt(null)).toBeNull();
  });
});
