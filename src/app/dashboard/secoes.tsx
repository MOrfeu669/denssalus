import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ApresentacaoDashboard, CampoDashboard, ResumoDashboard } from "../../domain/dashboard/tipos";
import { iniciaisDoNome } from "../casca-usuario";
import { moeda, percentual, pontos } from "./formato";

const CORES = ["agendado", "blue", "ok", "aviso"] as const;

export function oculto(ocultos: CampoDashboard[], campo: CampoDashboard): boolean {
  return ocultos.includes(campo);
}

export function Kpis({
  resumo,
  apresentacao,
  ocultos,
  ocultar,
  pendente,
}: {
  resumo: ResumoDashboard;
  apresentacao: ApresentacaoDashboard;
  ocultos: CampoDashboard[];
  ocultar: (campo: CampoDashboard) => void;
  pendente: boolean;
}) {
  return (
    <div className="dashboard-kpis">
      {oculto(ocultos, "faturamento") ? null : (
        <article className="dashboard-kpi">
          <Cabeca rotulo="Faturamento no período" campo="faturamento" ocultar={ocultar} pendente={pendente} />
          <p className="dashboard-numero">{moeda(resumo.faturado)}</p>
          {apresentacao.variacaoFaturado != null ? (
            <p className="dashboard-delta">
              <Selo tom={apresentacao.variacaoFaturado >= 0 ? "ok" : "perigo"}>{percentual(apresentacao.variacaoFaturado)}</Selo>
              <span>vs. período anterior</span>
            </p>
          ) : null}
        </article>
      )}
      {oculto(ocultos, "recebido") ? null : (
        <article className="dashboard-kpi">
          <Cabeca rotulo="Valores recebidos" campo="recebido" ocultar={ocultar} pendente={pendente} />
          <p className="dashboard-numero">{moeda(resumo.recebido)}</p>
          {apresentacao.parteRecebida != null ? (
            <p className="dashboard-delta">
              <Selo tom="neutro">{`${Math.round(apresentacao.parteRecebida)}%`}</Selo>
              <span>do faturado</span>
            </p>
          ) : null}
        </article>
      )}
      {oculto(ocultos, "recebido") ? null : (
        <article className="dashboard-kpi">
          <p className="dashboard-kicker">A receber</p>
          <p className="dashboard-numero">{moeda(apresentacao.aReceber.valor)}</p>
          <p className="dashboard-delta">
            <Selo tom="aviso">{`${apresentacao.aReceber.debitos} débitos`}</Selo>
          </p>
        </article>
      )}
      {oculto(ocultos, "ocupacao") ? null : (
        <article className="dashboard-kpi">
          <Cabeca rotulo="Ocupação da agenda" campo="ocupacao" ocultar={ocultar} pendente={pendente} />
          <p className="dashboard-numero">{`${Math.round(resumo.ocupacao)}%`}</p>
          <span className="dashboard-ocupacao" aria-hidden="true">
            <span style={{ width: `${Math.min(Math.max(resumo.ocupacao, 0), 100)}%` }} />
          </span>
          {apresentacao.variacaoOcupacao != null ? (
            <p className="dashboard-delta">
              <Selo tom={apresentacao.variacaoOcupacao >= 0 ? "ok" : "perigo"}>{pontos(apresentacao.variacaoOcupacao)}</Selo>
              <span>vs. período anterior</span>
            </p>
          ) : null}
        </article>
      )}
    </div>
  );
}

function Cabeca({
  rotulo,
  campo,
  ocultar,
  pendente,
}: {
  rotulo: string;
  campo: CampoDashboard;
  ocultar: (campo: CampoDashboard) => void;
  pendente: boolean;
}) {
  return (
    <div className="dashboard-kpi-cabeca">
      <p className="dashboard-kicker">{rotulo}</p>
      <button type="button" className="papel-botao papel-botao-fantasma" disabled={pendente} onClick={() => ocultar(campo)}>
        Ocultar
      </button>
    </div>
  );
}

function Selo({ tom, children }: { tom: "ok" | "perigo" | "aviso" | "neutro"; children: string }) {
  return <span className={`dashboard-selo dashboard-selo-${tom}`}>{children}</span>;
}

export function PorDentista({
  apresentacao,
  pendente,
  ocultar,
}: {
  apresentacao: ApresentacaoDashboard;
  pendente: boolean;
  ocultar: (campo: CampoDashboard) => void;
}) {
  const maior = apresentacao.dentistas.reduce((max, item) => Math.max(max, item.valor), 0);
  return (
    <section className="dashboard-card" aria-labelledby="dashboard-dentistas">
      <div className="dashboard-card-cabeca">
        <span>
          <h2 id="dashboard-dentistas" className="dashboard-card-titulo">Por dentista</h2>
          <p className="dashboard-card-apoio">Faturamento no período</p>
        </span>
        <button type="button" className="papel-botao papel-botao-fantasma" disabled={pendente} onClick={() => ocultar("detalhe")}>
          Ocultar
        </button>
      </div>
      {apresentacao.dentistas.length === 0 ? <p className="dashboard-vazio">Nenhum faturamento por dentista no período</p> : null}
      <ul className="dashboard-dentistas">
        {apresentacao.dentistas.map((item, indice) => {
          const cor = CORES[indice % CORES.length] ?? "agendado";
          return (
            <li key={item.dentistaId}>
              <span className={`dashboard-avatar dashboard-avatar-${cor}`} aria-hidden="true">{iniciaisDoNome(item.nome)}</span>
              <span className="dashboard-dentista-texto">
                <span className="dashboard-dentista-nome">{item.nome}</span>
                {item.especialidade ? <span className="dashboard-card-apoio">{item.especialidade}</span> : null}
                <span className="dashboard-trilho">
                  <span className={`dashboard-trilho-valor dashboard-trilho-${cor}`} style={{ width: `${maior > 0 ? (item.valor / maior) * 100 : 0}%` }} />
                </span>
              </span>
              <strong>{moeda(item.valor)}</strong>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function PorProcedimento({
  apresentacao,
}: {
  apresentacao: ApresentacaoDashboard;
}) {
  return (
    <section className="dashboard-card" aria-labelledby="dashboard-procedimentos">
      <h2 id="dashboard-procedimentos" className="dashboard-card-titulo">Por procedimento</h2>
      <p className="dashboard-card-apoio">Top 6 no período</p>
      {apresentacao.procedimentos.length === 0 ? <p className="dashboard-vazio">Nenhum faturamento por procedimento no período</p> : (
        <table className="dashboard-tabela">
          <thead>
            <tr>
              <th>Procedimento</th>
              <th>Qtd.</th>
              <th>Faturado</th>
              <th>Participação</th>
            </tr>
          </thead>
          <tbody>
            {apresentacao.procedimentos.map((item) => (
              <tr key={item.procedimentoId}>
                <td>{item.nome}</td>
                <td className="dashboard-num">{item.quantidade}</td>
                <td className="dashboard-num">{moeda(item.valor)}</td>
                <td>
                  <span className="dashboard-participacao">
                    <span className="dashboard-trilho">
                      <span className="dashboard-trilho-valor dashboard-trilho-agendado" style={{ width: `${Math.min(item.participacao, 100)}%` }} />
                    </span>
                    <span className="dashboard-num">{`${item.participacao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function EstoqueCritico({
  resumo,
  apresentacao,
  ocultos,
  pendente,
  ocultar,
}: {
  resumo: ResumoDashboard;
  apresentacao: ApresentacaoDashboard;
  ocultos: CampoDashboard[];
  pendente: boolean;
  ocultar: (campo: CampoDashboard) => void;
}) {
  const mostraEstoque = !oculto(ocultos, "estoque");
  const mostraDespesa = !oculto(ocultos, "despesa");
  if (!mostraEstoque && !mostraDespesa) return null;
  return (
    <section className="dashboard-card dashboard-card-estoque" aria-labelledby="dashboard-estoque">
      {mostraEstoque ? (
        <>
          <div className="dashboard-card-cabeca">
            <span>
              <h2 id="dashboard-estoque" className="dashboard-card-titulo">Estoque crítico</h2>
              <p className="dashboard-card-apoio">Materiais abaixo do mínimo</p>
            </span>
            <Badge className="h-[22px] rounded-full bg-paper-tint-warning text-aviso-tinta">{`${resumo.estoque.length} itens`}</Badge>
          </div>
          <button type="button" className="papel-botao papel-botao-fantasma" disabled={pendente} onClick={() => ocultar("estoque")}>
            Ocultar
          </button>
          {resumo.estoque.length === 0 ? <p className="dashboard-vazio">Nenhum material abaixo do mínimo</p> : (
            <ul className="dashboard-criticos">
              {resumo.estoque.map((item) => {
                const critico = item.quantidade * 3 <= item.minimo;
                return (
                  <li key={item.materialId}>
                    <span>
                      <strong>{item.nome}</strong>
                      <span className="dashboard-card-apoio">{`${item.quantidade} de ${item.minimo} unidades`}</span>
                    </span>
                    <Badge className={critico ? "h-[22px] rounded-full bg-paper-tint-danger text-perigo-tinta" : "h-[22px] rounded-full bg-paper-tint-warning text-aviso-tinta"}>
                      {critico ? "Crítico" : "Baixo"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
          <Link className="papel-botao papel-botao-secundario dashboard-link" href="/estoque">Abrir estoque</Link>
        </>
      ) : null}
      {mostraDespesa ? (
        <div className="dashboard-despesa">
          <span>
            <h3>Despesa de prótese</h3>
            <p className="dashboard-card-apoio">{`${apresentacao.trabalhosProtese} trabalhos com laboratórios`}</p>
          </span>
          <strong>{moeda(resumo.despesaProtese)}</strong>
          <button type="button" className="papel-botao papel-botao-fantasma" disabled={pendente} onClick={() => ocultar("despesa")}>
            Ocultar despesa
          </button>
        </div>
      ) : null}
    </section>
  );
}
