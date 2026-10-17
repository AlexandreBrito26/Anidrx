import { useCallback, useEffect, useState } from "react";

const KEY = "anidrx:effects";

function initial(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "on" || saved === "off") return saved === "on";
  } catch {
    /* armazenamento indisponível */
  }
  // Sem escolha salva: respeita quem pediu menos movimento no aparelho.
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}

export function useEffects() {
  const [on, setOn] = useState<boolean>(initial);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, on ? "on" : "off");
    } catch {
      /* ignora */
    }
  }, [on]);

  const toggle = useCallback(() => setOn((v) => !v), []);
  return { on, toggle };
}
