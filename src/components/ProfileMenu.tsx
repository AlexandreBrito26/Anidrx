import { useEffect, useRef, useState } from "react";
import { useProfiles } from "../hooks/useProfiles";
import { useTheme } from "../hooks/useTheme";
import { isTheme } from "../themes";
import { AVATARS, createProfile, deleteProfile, MAX_NAME, switchProfile } from "../profiles";

export default function ProfileMenu() {
  const { profiles, active } = useProfiles();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const choose = (id: string | null) => {
    const profile = switchProfile(id);
    // Cada perfil lembra o seu tema.
    if (profile?.theme && isTheme(profile.theme)) setTheme(profile.theme);
    setOpen(false);
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (createProfile(name, avatar, theme)) {
      setName("");
      setOpen(false);
    }
  };

  const remove = () => {
    if (active && window.confirm(`Excluir o perfil "${active.name}" e os favoritos e a lista dele?`)) {
      deleteProfile(active.id);
    }
  };

  return (
    <div className="profile" ref={rootRef}>
      <button
        className="btn btn--small profile__btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={active ? `Perfil: ${active.name}` : "Perfil: visitante"}
      >
        <span aria-hidden="true">{active ? active.avatar : "👤"}</span>
        <span className="profile__name">{active ? active.name : "Entrar"}</span>
      </button>

      {open && (
        <div className="profile__panel" role="group" aria-label="Perfis">
          {profiles.length > 0 && (
            <ul className="profile__list">
              {profiles.map((p) => (
                <li key={p.id}>
                  <button
                    className="profile__item"
                    onClick={() => choose(p.id)}
                    aria-current={p.id === active?.id ? "true" : undefined}
                  >
                    <span aria-hidden="true">{p.avatar}</span> {p.name}
                  </button>
                </li>
              ))}
              <li>
                <button className="profile__item" onClick={() => choose(null)} aria-current={active ? undefined : "true"}>
                  <span aria-hidden="true">👤</span> Visitante
                </button>
              </li>
            </ul>
          )}

          <form className="profile__form" onSubmit={create}>
            <label>
              Novo perfil
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_NAME}
                placeholder="Seu nome"
                autoComplete="off"
              />
            </label>
            <div className="profile__avatars" role="radiogroup" aria-label="Avatar">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={avatar === a}
                  aria-label={`Avatar ${a}`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            <button className="btn btn--small btn--primary" type="submit" disabled={!name.trim()}>
              Criar perfil
            </button>
          </form>
          <p className="profile__note">Os perfis ficam só neste navegador, sem senha.</p>

          {active && (
            <button className="btn btn--small" onClick={remove}>
              Excluir "{active.name}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
