import type { DiaFaturado } from "../../domain/dashboard/tipos";
import { moeda, rotuloDia, rotuloEixo, tetoDe, textoMeta } from "./formato";

export function GraficoDiario({
  dias,
  meta,
  hoje,
}: {
  dias: DiaFaturado[];
  meta: number | null;
  hoje: string;
}) {
  if (dias.length === 0) return <p className="dashboard-vazio">Nenhum dia no período</p>;
  const pico = Math.max(...dias.map((dia) => dia.valor), meta ?? 0);
  const teto = tetoDe(pico);
  const marcas = [teto, (2 * teto) / 3, teto / 3, 0];
  const destaque = dias.some((dia) => dia.data === hoje) ? hoje : dias[dias.length - 1]?.data;
  const indice = Math.max(0, dias.findIndex((dia) => dia.data === destaque));
  const diaDestaque = dias[indice];

  return (
    <figure className="dashboard-grafico">
      <figcaption className="dashboard-grafico-topo">
        <span>
          <span className="dashboard-card-titulo">Faturamento diário</span>
          <span className="dashboard-card-apoio">{textoMeta(meta)}</span>
        </span>
        <span className="dashboard-legenda">
          <span><i className="dashboard-legenda-realizado" /> Realizado</span>
          <span><i className="dashboard-legenda-hoje" /> Hoje</span>
          {meta != null ? <span><i className="dashboard-legenda-meta" /> Meta</span> : null}
        </span>
      </figcaption>
      <div
        className="dashboard-grafico-corpo"
        role="img"
        aria-label={`Faturamento diário de ${dias[0]?.data} a ${dias[dias.length - 1]?.data}`}
      >
        <div className="dashboard-eixo">
          {marcas.map((marca) => (
            <span key={marca}>{rotuloEixo(marca)}</span>
          ))}
        </div>
        <div className="dashboard-plot">
          {marcas.map((marca) => (
            <span key={marca} className="dashboard-grade" style={{ bottom: `${(marca / teto) * 100}%` }} />
          ))}
          {meta != null ? (
            <span className="dashboard-linha-meta" style={{ bottom: `${(meta / teto) * 100}%` }} />
          ) : null}
          <div className="dashboard-colunas">
            {dias.map((dia) => {
              const hojeBarra = dia.data === destaque;
              return (
                <div key={dia.data} className="dashboard-coluna">
                  <div className="dashboard-coluna-trilho">
                    <div
                      className={hojeBarra ? "dashboard-coluna-valor dashboard-coluna-hoje" : "dashboard-coluna-valor"}
                      style={{ height: `${Math.max((dia.valor / teto) * 100, dia.valor > 0 ? 2 : 0)}%` }}
                      title={`${rotuloDia(dia.data)} ${moeda(dia.valor)}`}
                    />
                  </div>
                  <span className={hojeBarra ? "dashboard-coluna-dia dashboard-coluna-dia-hoje" : "dashboard-coluna-dia"}>
                    {dia.data.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>
          {diaDestaque ? (
            <div
              className="dashboard-dica"
              style={{
                left: `${((indice + 0.5) / dias.length) * 100}%`,
                bottom: `calc(1.5rem + ${(diaDestaque.valor / teto) * 100}%)`,
              }}
            >
              <span>{rotuloDia(diaDestaque.data)}</span>
              <strong>{moeda(diaDestaque.valor)}</strong>
            </div>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
