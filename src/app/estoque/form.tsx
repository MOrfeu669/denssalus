"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrarMaterial, reabastecerMaterial, vincular } from "./actions";

export type MovimentoTela = {
  id: string;
  tipo: string;
  quantidade: number;
  usuario: string;
  registradoEm: string;
};

export type MaterialTela = {
  id: string;
  nome: string;
  quantidade: number;
  historico: MovimentoTela[];
};

export function Estoque({
  materiais,
  procedimentos,
}: {
  materiais: MaterialTela[];
  procedimentos: { id: string; nome: string }[];
}) {
  const roteador = useRouter();
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrarMaterial, estadoVazio);
  const [reposicao, acaoReabastecer, pendenteReabastecer] = useActionState(
    reabastecerMaterial,
    estadoVazio,
  );
  const [vinculo, acaoVincular, pendenteVincular] = useActionState(vincular, estadoVazio);
  const aviso = avisoVisivel(cadastro, reposicao, vinculo);

  useEffect(() => {
    if ([cadastro, reposicao, vinculo].some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, reposicao, vinculo, roteador]);

  return (
    <>
      <Aviso tipo={aviso.status} mensagem={aviso.mensagem} />
      {materiais.length === 0 ? (
        <p>Nenhum material cadastrado nesta clínica.</p>
      ) : (
        <ul className="lista">
          {materiais.map((material) => (
            <li key={material.id}>
              <span>{`${material.nome} · ${material.quantidade}`}</span>
              <form action={acaoReabastecer} aria-busy={pendenteReabastecer}>
                <input type="hidden" name="materialId" value={material.id} />
                <input type="hidden" name="nomeMaterial" value={material.nome} />
                <label>
                  {`Quantidade a reabastecer de ${material.nome}`}
                  <input name="quantidade" type="number" min={1} step={1} required />
                </label>
                <label>
                  {`Validade do lote de ${material.nome}`}
                  <input name="validade" type="date" required />
                </label>
                <button type="submit" disabled={pendenteReabastecer}>
                  {pendenteReabastecer ? "Salvando…" : "Reabastecer"}
                </button>
              </form>
              <Historico material={material} />
            </li>
          ))}
        </ul>
      )}
      <form
        key={cadastro.status === "sucesso" ? cadastro.quando : 0}
        action={acaoCadastrar}
        aria-busy={pendenteCadastrar}
      >
        <label>
          Nome
          <input name="nome" required />
        </label>
        <label>
          Quantidade
          <input name="quantidade" type="number" min={1} step={1} required />
        </label>
        <label>
          Quantidade mínima
          <input name="quantidadeMinima" type="number" min={0} step={1} required />
        </label>
        <label>
          Validade
          <input name="validade" type="date" required />
        </label>
        <button type="submit" disabled={pendenteCadastrar}>
          {pendenteCadastrar ? "Salvando…" : "Cadastrar material"}
        </button>
      </form>
      <form
        key={vinculo.status === "sucesso" ? vinculo.quando : 1}
        action={acaoVincular}
        aria-busy={pendenteVincular}
      >
        <label>
          Procedimento
          <select name="procedimentoId" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {procedimentos.map((procedimento) => (
              <option key={procedimento.id} value={procedimento.id}>
                {procedimento.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Material
          <select name="materialId" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {materiais.map((material) => (
              <option key={material.id} value={material.id}>
                {material.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantidade por consulta
          <input name="quantidade" type="number" min={1} step={1} required />
        </label>
        <button type="submit" disabled={pendenteVincular}>
          {pendenteVincular ? "Salvando…" : "Vincular material"}
        </button>
      </form>
    </>
  );
}

function Historico({ material }: { material: MaterialTela }) {
  if (material.historico.length === 0) return <p>Nenhuma movimentação registrada.</p>;
  return (
    <ul className="lista" aria-label={`Histórico de ${material.nome}`}>
      {material.historico.map((item) => (
        <li key={item.id}>
          {`${item.tipo} · ${item.quantidade} · ${item.usuario} · ${item.registradoEm}`}
        </li>
      ))}
    </ul>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem };
}
