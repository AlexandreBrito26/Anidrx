import { THEMES, useTheme } from "../hooks/useTheme";
import type { Theme } from "../hooks/useTheme";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <select
      className="theme-picker"
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      aria-label="Tema"
    >
      {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
    </select>
  );
}
