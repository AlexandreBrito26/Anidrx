import { useCallback, useEffect, useState } from "react";
import { getCachedTranslation, translateToPt } from "../translate";

export type SynopsisStatus = "idle" | "loading" | "done" | "error";

/**
 * Traduz a sinopse para português do Brasil assim que ela aparece. Enquanto traduz, mostra o
 * original; se falhar, mantém o original e permite tentar de novo. `showOriginal` alterna os dois.
 */
export function useSynopsisPt(text: string | null) {
  const [result, setResult] = useState<{ source: string; text: string } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const translated = !text
    ? null
    : (getCachedTranslation(text) ?? (result?.source === text ? result.text : null));

  useEffect(() => {
    if (!text || translated !== null) return;
    const ctrl = new AbortController();
    setFailed(null);
    translateToPt(text, { signal: ctrl.signal })
      .then((out) => setResult({ source: text, text: out }))
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(text);
      });
    return () => ctrl.abort();
    // `translated` fica de fora de propósito: só refazemos quando o texto muda ou o usuário tenta de novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, tries]);

  const status: SynopsisStatus = !text
    ? "idle"
    : translated !== null
      ? "done"
      : failed === text
        ? "error"
        : "loading";

  return {
    status,
    /** O texto a exibir: tradução quando existe (e não foi pedido o original), senão o original. */
    text: translated !== null && !showOriginal ? translated : text,
    /** A tradução existe e é diferente do original (só então vale oferecer "Ver original"). */
    changed: translated !== null && translated !== text,
    showOriginal,
    toggleOriginal: useCallback(() => setShowOriginal((v) => !v), []),
    retry: useCallback(() => setTries((n) => n + 1), []),
  };
}
