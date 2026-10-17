import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OfflineBanner from "./OfflineBanner";

function setOnline(value: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(value);
  act(() => {
    window.dispatchEvent(new Event(value ? "online" : "offline"));
  });
}

describe("OfflineBanner", () => {
  afterEach(() => vi.restoreAllMocks());

  it("não aparece quando há conexão", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("aparece ao perder a conexão e some quando ela volta", () => {
    render(<OfflineBanner />);

    setOnline(false);
    expect(screen.getByRole("status")).toHaveTextContent("Sem conexão");

    setOnline(true);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
