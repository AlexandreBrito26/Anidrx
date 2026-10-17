import { useTheme } from "../hooks/useTheme";
import { LOGO } from "../themes";

interface Props {
  size?: number;
}

/** Marca do Anidrx: "A" geométrico com faísca. As cores seguem o tema. */
export function LogoMark({ size = 32 }: Props) {
  const { theme } = useTheme();
  const c = LOGO[theme];
  return (
    <svg className="logo__mark" width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="112" fill={c.tile} />
      <path d="M132 392 L256 118 L380 392" fill="none" stroke={c.a} strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M192 320 H320" stroke={c.bar} strokeWidth="44" strokeLinecap="round" />
      <path d="M404 54 Q414 112 472 122 Q414 132 404 190 Q394 132 336 122 Q394 112 404 54Z" fill={c.spark} />
    </svg>
  );
}

export default function Logo({ size = 32 }: Props) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo__word">Anidrx</span>
    </span>
  );
}
