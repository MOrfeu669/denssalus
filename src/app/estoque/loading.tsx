import "./tela.css";

export default function Loading() {
  return (
    <div className="estoque-tela" aria-busy="true">
      <h1>Estoque</h1>
      <p className="estoque-vazio">Carregando o estoque…</p>
    </div>
  );
}
