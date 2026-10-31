import type { MaterialTela } from "./form";

const TIPO: Record<string, string> = {
  entrada: "Entrada",
  baixa: "Baixa",
  vencimento: "Vencimento",
};

export function Historico({ material }: { material: MaterialTela }) {
  return (
    <details className="estoque-historico">
      <summary>{`Ver histórico de ${material.nome}`}</summary>
      {material.historico.length === 0 ? (
        <p className="estoque-vazio">Nenhuma movimentação registrada.</p>
      ) : (
        <ul className="estoque-movimentos" aria-label={`Histórico de ${material.nome}`}>
          {material.historico.map((item) => (
            <li key={item.id} className="estoque-movimento">
              <span className="estoque-movimento-tipo">{TIPO[item.tipo] ?? item.tipo}</span>
              <span>{`${item.quantidade} unidades`}</span>
              <span>{item.usuario}</span>
              <span>{item.registradoEm}</span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
