import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { reloadProfiles } from "../profiles";
import ProfileMenu from "./ProfileMenu";

describe("ProfileMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadProfiles();
  });

  it("cria um perfil, entra nele e depois volta para visitante", () => {
    render(<ProfileMenu />);
    expect(screen.getByRole("button", { name: "Perfil: visitante" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Perfil: visitante" }));
    const create = screen.getByRole("button", { name: "Criar perfil" });
    expect(create).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Novo perfil"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("radio", { name: "Avatar 🐱" }));
    fireEvent.click(create);
    expect(screen.getByRole("button", { name: "Perfil: Ana" })).toHaveTextContent("🐱");

    fireEvent.click(screen.getByRole("button", { name: "Perfil: Ana" }));
    fireEvent.click(screen.getByRole("button", { name: /Visitante/ }));
    expect(screen.getByRole("button", { name: "Perfil: visitante" })).toBeInTheDocument();
  });
});
