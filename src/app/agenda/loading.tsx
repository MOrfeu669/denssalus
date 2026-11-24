import "./tela.css";

export default function Loading() {
  return (
    <div className="agenda-tela" aria-busy="true">
      <h1>Agenda</h1>
      <p className="m-0 text-base leading-6 text-paper-ink-2">Carregando…</p>
    </div>
  );
}
