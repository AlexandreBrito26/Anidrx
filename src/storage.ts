// Armazenamento dos dados da pessoa (favoritos e Minha lista), com IndexedDB.
//
// Como funciona:
// - Ao abrir o app, `initStorage()` carrega tudo do IndexedDB para a memória. Depois disso, ler é
//   síncrono (como era no localStorage) e gravar atualiza a memória na hora e o IndexedDB em seguida.
// - Quem já tinha dados no localStorage é migrado sozinho: primeiro grava no IndexedDB, e só depois
//   de confirmar apaga do localStorage. Se algo falhar no meio, nada se perde.
// - Sem IndexedDB (navegador antigo, modo privado restrito, testes), tudo segue no localStorage.
// - Abas abertas ao mesmo tempo se avisam por BroadcastChannel.
// - Pede ao navegador armazenamento persistente (`navigator.storage.persist()`), para ele não
//   apagar os dados quando faltar espaço.
//
// Perfis, tema e cache de tradução são pequenos e precisam existir antes do primeiro render,
// então continuam direto no localStorage.

const DB_NAME = "anidrx";
const STORE = "kv";
const CHANNEL = "anidrx-storage";
// Chaves base que vivem no IndexedDB; cada perfil usa "base:idDoPerfil".
const MIGRATE_BASES = ["anidrx:favorites", "anidrx:watchlist"];

type Listener = (key: string | null) => void;

let db: IDBDatabase | null = null;
let channel: BroadcastChannel | null = null;
let initPromise: Promise<void> | null = null;
let pending: Promise<void> = Promise.resolve();
const cache = new Map<string, string>();
const listeners = new Set<Listener>();
// Chaves cujo último valor só coube no localStorage (IndexedDB falhou).
const backedUp = new Set<string>();

const isManaged = (key: string) => MIGRATE_BASES.some((b) => key === b || key.startsWith(`${b}:`));

function finished(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transação cancelada"));
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("Banco bloqueado por outra aba"));
  });
}

function loadAll(database: IDBDatabase): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    const out = new Map<string, string>();
    const req = database.transaction(STORE, "readonly").objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve(out);
      if (typeof cursor.value === "string") out.set(String(cursor.key), cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

// Dados que ainda estão no localStorage: da versão antiga ou de uma gravação que falhou no IndexedDB.
function legacyEntries(): [string, string][] {
  const found: [string, string][] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = key && isManaged(key) ? localStorage.getItem(key) : null;
      if (key && value !== null) found.push([key, value]);
    }
  } catch {
    /* localStorage indisponível */
  }
  return found;
}

function openChannel() {
  if (typeof BroadcastChannel === "undefined") return;
  channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e: MessageEvent<{ key?: unknown; value?: unknown }>) => {
    const { key, value } = e.data ?? {};
    if (typeof key !== "string" || !isManaged(key)) return;
    if (typeof value === "string") cache.set(key, value);
    else cache.delete(key);
    listeners.forEach((l) => l(key));
  };
}

async function doInit() {
  if (typeof indexedDB === "undefined") return;
  let database: IDBDatabase | undefined;
  try {
    database = await openDb();
    const stored = await loadAll(database);

    // O localStorage ganha do IndexedDB: ali só fica dado mais novo ou ainda não migrado.
    const legacy = legacyEntries();
    if (legacy.length > 0) {
      const tx = database.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const [key, value] of legacy) store.put(value, key);
      await finished(tx);
      for (const [key, value] of legacy) stored.set(key, value);
      try {
        for (const [key] of legacy) localStorage.removeItem(key);
      } catch {
        /* ficou uma cópia velha; na próxima vez é migrada de novo, sem prejuízo */
      }
    }

    stored.forEach((value, key) => cache.set(key, value));
    db = database;
    openChannel();
    try {
      void navigator.storage?.persist?.()?.catch(() => {});
    } catch {
      /* sem suporte */
    }
  } catch {
    // Qualquer falha na abertura: segue no localStorage, que ainda tem todos os dados.
    database?.close();
    cache.clear();
    db = null;
  }
}

/** Abre o IndexedDB e migra os dados antigos. Chame (e espere) antes de renderizar o app. */
export function initStorage(): Promise<void> {
  return (initPromise ??= doInit());
}

export const storageMode = (): "indexeddb" | "localstorage" => (db ? "indexeddb" : "localstorage");

export function getItem(key: string): string | null {
  if (db) return cache.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Grava no IndexedDB em fila (uma gravação por vez, na ordem em que foram pedidas).
function persist(key: string, value: string | null) {
  channel?.postMessage({ key, value });
  pending = pending.then(async () => {
    try {
      const tx = db!.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      if (value === null) store.delete(key);
      else store.put(value, key);
      await finished(tx);
      if (backedUp.delete(key)) {
        try {
          localStorage.removeItem(key); // a cópia de emergência ficou velha
        } catch {
          /* ignora */
        }
      }
    } catch {
      // Não coube no IndexedDB (cota, banco fechado): guarda no localStorage, e a próxima abertura migra.
      if (value !== null) {
        backedUp.add(key);
        try {
          localStorage.setItem(key, value);
        } catch {
          /* sem onde guardar: o dado vale só até fechar o app */
        }
      }
    }
  });
}

export function setItem(key: string, value: string): void {
  if (db) {
    cache.set(key, value);
    persist(key, value);
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* armazenamento indisponível */
  }
}

export function removeItem(key: string): void {
  if (db) {
    cache.delete(key);
    persist(key, null);
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignora */
  }
}

/** Avisa quando outra aba muda uma chave (`null` = vários dados mudaram). Devolve o cancelamento. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => listener(e.key);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Resolve quando todas as gravações pedidas até agora chegaram ao IndexedDB. */
export const flushStorage = (): Promise<void> => pending;

/** Volta ao estado de antes do `initStorage` (só para testes). */
export function resetStorageForTests() {
  db?.close();
  channel?.close();
  db = null;
  channel = null;
  initPromise = null;
  pending = Promise.resolve();
  cache.clear();
  listeners.clear();
  backedUp.clear();
}
