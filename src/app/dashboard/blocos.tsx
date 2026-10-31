import type { ReactNode } from "react";
import type { CampoDashboard } from "../../domain/dashboard/tipos";

export function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function data(valor: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : valor;
}

export function Bloco({
  campo,
  titulo,
  ocultos,
  pendente,
  ocultar,
  children,
}: {
  campo: CampoDashboard;
  titulo: string;
  ocultos: CampoDashboard[];
  pendente: boolean;
  ocultar: (campo: CampoDashboard) => void;
  children: ReactNode;
}) {
  if (ocultos.includes(campo)) return null;
  const id = `bloco-${campo}`;
  return (
    <section className={`dashboard-bloco dashboard-bloco-${campo}`} aria-labelledby={id}>
      <div className="dashboard-bloco-topo">
        <h2 id={id}>{titulo}</h2>
        <button
          type="button"
          className="dashboard-botao dashboard-botao-discreto"
          aria-describedby={id}
          disabled={pendente}
          onClick={() => ocultar(campo)}
        >
          Ocultar
        </button>
      </div>
      {children}
    </section>
  );
}

export function Valores({
  titulo,
  itens,
  vazio,
}: {
  titulo: string;
  itens: { id: string; valor: number }[];
  vazio: string;
}) {
  return (
    <div className="dashboard-detalhe">
      <h3>{titulo}</h3>
      {itens.length === 0 ? (
        <p className="dashboard-vazio">{vazio}</p>
      ) : (
        <ul className="dashboard-valores" aria-label={titulo}>
          {itens.map((item) => (
            <li key={item.id} className="dashboard-valor-linha">
              <span>{item.id}</span>
              <strong>{moeda(item.valor)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
