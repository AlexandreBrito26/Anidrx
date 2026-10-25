import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <footer className="footer">
      <div className="footer__in">
        <Link className="footer__brand" to="/" aria-label="Anidrx, ir para o início">
          <Logo size={28} />
        </Link>
        <p className="footer__text">
          Dados de{" "}
          <a href="https://anilist.co" target="_blank" rel="noreferrer">AniList</a>. Capas e títulos
          pertencem aos seus respectivos donos.
        </p>
        <nav className="footer__links" aria-label="Rodapé">
          <Link to="/temporada">Temporada</Link>
          <a href="https://github.com/AlexandreBrito26" target="_blank" rel="noreferrer">GitHub</a>
          <button className="footer__top" onClick={toTop}>Voltar ao topo ↑</button>
        </nav>
      </div>
    </footer>
  );
}
