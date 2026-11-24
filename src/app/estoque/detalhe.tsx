import { ArrowDownToLine, ArrowUpFromLine, X } from "lucide-react";
import type { MaterialTela } from "./form";
import { consumoSemanal, quandoCurto, situacaoQuantidade } from "./situacao";

const ROTULO = { entrada: "Entrada", baixa: "Baixa", vencimento: "Vencimento" } as const;

export function DetalheMaterial({
  material,
  onFechar,
  onEntrada,
  onBaixa,
}: {
  material: MaterialTela;
  onFechar: () => void;
  onEntrada: () => void;
  onBaixa: () => void;
}) {
  const situacao = situacaoQuantidade(material.quantidade, material.quantidadeMinima);
  const consumo = consumoSemanal(material.historico);
  const consumoTexto = consumo == null ? null : consumo.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return (
    <aside className="estoque-detalhe" aria-labelledby="estoque-detalhe-titulo">
      <p className="estoque-kicker">Material selecionado</p>
      <button type="button" className="papel-botao papel-botao-fantasma estoque-fechar" aria-label="Fechar detalhe do material" onClick={onFechar}>
        <X aria-hidden="true" />
      </button>
      <h2 id="estoque-detalhe-titulo">{material.nome}</h2>
      <p className="estoque-apoio">{material.validade ? `Validade mais próxima ${material.validade}` : "Sem lote com validade"}</p>
      <div className={`estoque-saldo estoque-saldo-${situacao}`}>
        <strong>{material.quantidade}</strong>
        <span>unidades em estoque</span>
        <p>
          {`Mínimo ${material.quantidadeMinima}`}
          {consumoTexto ? ` · consumo médio de ${consumoTexto} por semana` : ""}
        </p>
      </div>
      <div className="estoque-acoes-detalhe">
        <button type="button" className="papel-botao papel-botao-primario" onClick={onEntrada}>
          <ArrowDownToLine aria-hidden="true" /> Entrada
        </button>
        <button type="button" className="papel-botao papel-botao-secundario" onClick={onBaixa}>
          <ArrowUpFromLine aria-hidden="true" /> Baixa
        </button>
      </div>
      <h3>Histórico</h3>
      {material.historico.length === 0 ? <p className="estoque-vazio">Nenhuma movimentação registrada.</p> : (
        <ol className="estoque-historico">
          {material.historico.map((item, indice) => (
            <li key={item.id} className={item.tipo === "entrada" ? "estoque-mov-entrada" : "estoque-mov-saida"}>
              <span className="estoque-mov-icone" aria-hidden="true">{item.tipo === "entrada" ? "↓" : "↑"}</span>
              {indice < material.historico.length - 1 ? <span className="estoque-mov-linha" /> : null}
              <span>
                <strong>{`${ROTULO[item.tipo as keyof typeof ROTULO] ?? item.tipo} · ${item.quantidade} ${item.quantidade === 1 ? "unidade" : "unidades"}`}</strong>
                <span className="estoque-apoio">{item.usuario}</span>
              </span>
              <time dateTime={item.registradoEm}>{quandoCurto(item.registradoEm)}</time>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
