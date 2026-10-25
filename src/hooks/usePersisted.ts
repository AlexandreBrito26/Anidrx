import { useCallback, useState } from "react";
import { storageKey } from "../profiles";
import { useProfiles } from "./useProfiles";

/**
 * Estado salvo no localStorage por perfil: cada pessoa (ou o visitante) tem a sua cópia.
 * `parse` recebe o valor lido (qualquer coisa, inclusive lixo) e devolve sempre um valor válido.
 */
export function usePersisted<T>(base: string, parse: (raw: unknown) => T) {
  const { activeId } = useProfiles();
  const key = storageKey(base, activeId);

  const read = useCallback((): T => {
    try {
      return parse(JSON.parse(localStorage.getItem(key) ?? "null"));
    } catch {
      return parse(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [state, setState] = useState(() => ({ key, value: read() }));
  let value = state.value;
  if (state.key !== key) {
    // Trocou de perfil: recarrega os dados da nova pessoa.
    value = read();
    setState({ key, value });
  }

  const update = useCallback(
    (fn: (prev: T) => T) => {
      setState((s) => {
        const next = fn(s.key === key ? s.value : read());
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* armazenamento indisponível */
        }
        return { key, value: next };
      });
    },
    [key, read]
  );

  return [value, update] as const;
}
