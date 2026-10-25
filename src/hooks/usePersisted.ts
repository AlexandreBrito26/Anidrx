import { useCallback, useEffect, useRef, useState } from "react";
import { storageKey } from "../profiles";
import { getItem, setItem, subscribe } from "../storage";
import { useProfiles } from "./useProfiles";

// Cada componente que chama o hook tem a sua cópia do estado. Quando uma cópia grava, as outras
// da mesma chave (ex.: o seletor da lista e o contador de episódios na mesma página) releem o valor.
const listeners = new Map<string, Set<() => void>>();

function notifyOthers(key: string, self: (() => void) | null) {
  listeners.get(key)?.forEach((l) => {
    if (l !== self) l();
  });
}

/**
 * Estado salvo (IndexedDB, ou localStorage como alternativa; ver storage.ts) por perfil: cada
 * pessoa (ou o visitante) tem a sua cópia.
 * `parse` recebe o valor lido (qualquer coisa, inclusive lixo) e devolve sempre um valor válido.
 * Fica sincronizado entre componentes e entre abas abertas do navegador.
 */
export function usePersisted<T>(base: string, parse: (raw: unknown) => T) {
  const { activeId } = useProfiles();
  const key = storageKey(base, activeId);

  const read = useCallback((): T => {
    try {
      return parse(JSON.parse(getItem(key) ?? "null"));
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

  const self = useRef<(() => void) | null>(null);
  const dirty = useRef(false);

  // Outra cópia (ou outra aba) gravou esta chave: relê.
  useEffect(() => {
    const onChange = () => setState({ key, value: read() });
    self.current = onChange;
    const set = listeners.get(key) ?? new Set<() => void>();
    listeners.set(key, set);
    set.add(onChange);
    const unsubscribe = subscribe((changed) => {
      if (changed === key || changed === null) onChange();
    });
    return () => {
      set.delete(onChange);
      unsubscribe();
    };
  }, [key, read]);

  // Avisa as outras cópias só depois que o novo valor foi gravado e aplicado.
  useEffect(() => {
    if (!dirty.current) return;
    dirty.current = false;
    notifyOthers(key, self.current);
  }, [state, key]);

  const update = useCallback(
    (fn: (prev: T) => T) => {
      dirty.current = true;
      setState((s) => {
        const next = fn(s.key === key ? s.value : read());
        setItem(key, JSON.stringify(next));
        return { key, value: next };
      });
    },
    [key, read]
  );

  return [value, update] as const;
}
