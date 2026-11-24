import type { MaterialTela } from "./form";
import { mesAno, nivelBarra, situacaoQuantidade, tomValidade, type SituacaoEstoque } from "./situacao";

const SELO: Record<SituacaoEstoque, string> = {
  critico: "estoque-selo estoque-selo-critico",
  baixo: "estoque-selo estoque-selo-baixo",
  normal: "estoque-selo estoque-selo-normal",
};

const ROTULO: Record<SituacaoEstoque, string> = {
  critico: "Crítico",
  baixo: "Baixo",
  normal: "Normal",
};

export function TabelaMateriais({
  materiais,
  hoje,
  selecionado,
  onSelecionar,
}: {
  materiais: MaterialTela[];
  hoje: string;
  selecionado: string | null;
  onSelecionar: (id: string) => void;
}) {
  return (
    <div className="estoque-tabela-card">
      <table className="estoque-tabela" aria-label="Materiais da clínica">
        <thead>
          <tr>
            <th>Material</th>
            <th>Quantidade</th>
            <th>Mínimo</th>
            <th>Validade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {materiais.map((material) => {
            const situacao = situacaoQuantidade(material.quantidade, material.quantidadeMinima);
            const barra = nivelBarra(material.quantidade, material.quantidadeMinima);
            const tom = tomValidade(material.validade ?? null, hoje);
            const ativo = material.id === selecionado;
            return (
              <tr key={material.id} className={ativo ? "estoque-linha-ativa" : undefined}>
                <td>
                  <button type="button" className="papel-botao papel-botao-fantasma estoque-nome" onClick={() => onSelecionar(material.id)}>
                    {material.nome}
                  </button>
                </td>
                <td>
                  <span className={situacao === "normal" ? "estoque-qtd" : "estoque-qtd estoque-qtd-alerta"}>
                    {`${material.quantidade} unidades`}
                  </span>
                  <span className="estoque-nivel" title="A marca no meio da barra é o estoque mínimo">
                    <span className={`estoque-nivel-valor estoque-nivel-${situacao}`} style={{ width: `${barra.preenchido * 100}%` }} />
                    {barra.marca != null ? <span className="estoque-nivel-marca" style={{ left: `${barra.marca * 100}%` }} /> : null}
                  </span>
                </td>
                <td className="estoque-num">{material.quantidadeMinima}</td>
                <td className={tom === "perigo" ? "estoque-validade-perigo" : tom === "aviso" ? "estoque-validade-aviso" : "estoque-num"}>
                  {mesAno(material.validade ?? null)}
                </td>
                <td><span className={SELO[situacao]}>{ROTULO[situacao]}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="estoque-nota">Marca no meio da barra = estoque mínimo</p>
    </div>
  );
}
