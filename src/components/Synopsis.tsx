import { useSynopsisPt } from "../hooks/useSynopsisPt";

/** Sinopse traduzida automaticamente para pt-BR, com opção de ver o texto original em inglês. */
export default function Synopsis({ text }: { text: string | null }) {
  const s = useSynopsisPt(text);

  if (!text) return <p className="modal__synopsis">Sem sinopse disponível.</p>;

  return (
    <div className="synopsis">
      <p className="modal__synopsis">{s.text}</p>
      <p className="synopsis__note" aria-live="polite">
        {s.status === "loading" && "Traduzindo sinopse…"}
        {s.status === "error" && (
          <>
            Não foi possível traduzir agora.{" "}
            <button type="button" className="synopsis__btn" onClick={s.retry}>Tentar de novo</button>
          </>
        )}
        {s.changed && (
          <>
            {s.showOriginal ? "Texto original (inglês)" : "Traduzido automaticamente"}
            {" · "}
            <button type="button" className="synopsis__btn" onClick={s.toggleOriginal}>
              {s.showOriginal ? "Ver tradução" : "Ver original"}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
