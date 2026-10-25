// Perfis locais: guardam favoritos, lista de animes e tema por pessoa, só neste navegador.
// Não há senha nem servidor; é um jeito de várias pessoas (ou gostos) dividirem o mesmo aparelho.

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  theme?: string;
}

interface State {
  profiles: Profile[];
  activeId: string | null; // null = visitante (usa as chaves sem sufixo)
}

export const PROFILES_KEY = "anidrx:profiles";
export const FAVORITES_KEY = "anidrx:favorites";
export const WATCHLIST_KEY = "anidrx:watchlist";
export const AVATARS = ["🦊", "🐱", "🐼", "🐸", "🦉", "🐙", "🌸", "⚡"];
export const MAX_NAME = 24;

function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILES_KEY) ?? "null");
    const profiles: Profile[] = Array.isArray(raw?.profiles)
      ? raw.profiles.filter(
          (p: Profile) => p && typeof p.id === "string" && typeof p.name === "string" && typeof p.avatar === "string"
        )
      : [];
    const activeId = profiles.some((p) => p.id === raw?.activeId) ? (raw.activeId as string) : null;
    return { profiles, activeId };
  } catch {
    return { profiles: [], activeId: null };
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
  } catch {
    /* armazenamento indisponível */
  }
  listeners.forEach((l) => l());
}

export const getProfilesState = () => state;

export function subscribeProfiles(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Chave de armazenamento dos dados da pessoa ativa (visitante usa a chave base). */
export const storageKey = (base: string, activeId: string | null = state.activeId) =>
  activeId ? `${base}:${activeId}` : base;

const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  ).slice(0, 12);

function copyKey(base: string, toId: string) {
  try {
    const guest = localStorage.getItem(base);
    if (guest) localStorage.setItem(storageKey(base, toId), guest);
  } catch {
    /* ignora */
  }
}

/** Cria o perfil e já entra nele. O primeiro perfil herda os favoritos e a lista do visitante. */
export function createProfile(name: string, avatar: string, theme?: string): Profile | null {
  const clean = name.trim().slice(0, MAX_NAME);
  if (!clean) return null;
  const profile: Profile = { id: newId(), name: clean, avatar: avatar || AVATARS[0], theme };
  if (state.profiles.length === 0) {
    copyKey(FAVORITES_KEY, profile.id);
    copyKey(WATCHLIST_KEY, profile.id);
  }
  commit({ profiles: [...state.profiles, profile], activeId: profile.id });
  return profile;
}

/** Troca de perfil (null = visitante) e devolve o perfil escolhido. */
export function switchProfile(id: string | null): Profile | null {
  const profile = state.profiles.find((p) => p.id === id) ?? null;
  commit({ ...state, activeId: profile ? profile.id : null });
  return profile;
}

export function updateProfile(id: string, patch: Partial<Omit<Profile, "id">>) {
  const current = state.profiles.find((p) => p.id === id);
  if (!current) return;
  const next = { ...current, ...patch };
  if (!next.name.trim()) return;
  if (next.name === current.name && next.avatar === current.avatar && next.theme === current.theme) return;
  commit({ ...state, profiles: state.profiles.map((p) => (p.id === id ? next : p)) });
}

export function deleteProfile(id: string) {
  try {
    localStorage.removeItem(storageKey(FAVORITES_KEY, id));
    localStorage.removeItem(storageKey(WATCHLIST_KEY, id));
  } catch {
    /* ignora */
  }
  commit({
    profiles: state.profiles.filter((p) => p.id !== id),
    activeId: state.activeId === id ? null : state.activeId,
  });
}

/** Guarda o tema escolhido no perfil ativo (visitante não guarda). */
export function rememberTheme(theme: string) {
  if (state.activeId) updateProfile(state.activeId, { theme });
}

/** Relê os perfis do armazenamento (usado quando o armazenamento muda por fora, e nos testes). */
export function reloadProfiles() {
  state = load();
  listeners.forEach((l) => l());
}
