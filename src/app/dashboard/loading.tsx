import "./tela.css";

export default function Loading() {
  return (
    <div className="dashboard-tela" aria-busy="true">
      <h1>Dashboard financeiro</h1>
      <p className="dashboard-vazio">Carregando o dashboard…</p>
    </div>
  );
}
