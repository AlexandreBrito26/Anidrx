import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCachedTranslation, translateToPt } from "../translate";
import Synopsis from "./Synopsis";

const translate = vi.mocked(translateToPt);
const cached = vi.mocked(getCachedTranslation);

beforeEach(() => {
  translate.mockReset();
  cached.mockReset();
  cached.mockReturnValue(null);
});

describe("Synopsis", () => {
  it("sem texto, avisa que não há sinopse e não traduz nada", () => {
    render(<Synopsis text={null} />);
    expect(screen.getByText("Sem sinopse disponível.")).toBeInTheDocument();
    expect(translate).not.toHaveBeenCalled();
  });

  it("mostra o original enquanto traduz e depois troca pela tradução", async () => {
    translate.mockResolvedValue("Uma história sobre titãs.");
    render(<Synopsis text="A story about titans." />);

    expect(screen.getByText("A story about titans.")).toBeInTheDocument();
    expect(screen.getByText("Traduzindo sinopse…")).toBeInTheDocument();

    expect(await screen.findByText("Uma história sobre titãs.")).toBeInTheDocument();
    expect(screen.queryByText("A story about titans.")).not.toBeInTheDocument();
    expect(screen.getByText(/Traduzido automaticamente/)).toBeInTheDocument();
  });

  it("alterna entre tradução e original", async () => {
    translate.mockResolvedValue("Texto em português.");
    render(<Synopsis text="Text in English." />);
    await screen.findByText("Texto em português.");

    fireEvent.click(screen.getByRole("button", { name: "Ver original" }));
    expect(screen.getByText("Text in English.")).toBeInTheDocument();
    expect(screen.getByText(/Texto original \(inglês\)/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver tradução" }));
    expect(screen.getByText("Texto em português.")).toBeInTheDocument();
  });

  it("usa a tradução do cache na hora, sem pedir de novo", () => {
    cached.mockReturnValue("Já traduzido.");
    render(<Synopsis text="Already translated." />);
    expect(screen.getByText("Já traduzido.")).toBeInTheDocument();
    expect(translate).not.toHaveBeenCalled();
  });

  it("se a tradução falhar, mantém o original e deixa tentar de novo", async () => {
    translate.mockRejectedValueOnce(new Error("sem rede")).mockResolvedValueOnce("Deu certo.");
    render(<Synopsis text="It worked." />);

    expect(await screen.findByText(/Não foi possível traduzir agora/)).toBeInTheDocument();
    expect(screen.getByText("It worked.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(screen.getByText("Deu certo.")).toBeInTheDocument());
  });

  it("não oferece 'Ver original' quando a tradução é igual ao texto", async () => {
    translate.mockImplementation(async (t) => t);
    render(<Synopsis text="Naruto" />);
    await waitFor(() => expect(translate).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Ver original" })).not.toBeInTheDocument();
  });
});
