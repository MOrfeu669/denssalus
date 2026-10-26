"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { Procedimento } from "../../domain/procedimento/tipos";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, editar, excluir } from "./actions";

export function Procedimentos({
  procedimentos,
  podeExcluir,
}: {
  procedimentos: Procedimento[];
  podeExcluir: boolean;
}) {
  const roteador = useRouter();
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [exclusao, acaoExcluir, pendenteExcluir] = useActionState(excluir, estadoVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const aviso = avisoVisivel(cadastro, edicao, exclusao);

  useEffect(() => {
    if (edicao.status === "sucesso") setEditandoId(null);
  }, [edicao]);

  useEffect(() => {
    if ([cadastro, edicao, exclusao].some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, edicao, exclusao, roteador]);

  return (
    <>
      <Aviso tipo={aviso.status} mensagem={aviso.mensagem} />
      {procedimentos.length === 0 ? (
        <p>Nenhum procedimento cadastrado nesta clínica.</p>
      ) : (
        <ul className="lista">
          {procedimentos.map((procedimento) => (
            <li key={procedimento.id}>
              <span>{resumo(procedimento)}</span>
              <button
                type="button"
                onClick={() => setEditandoId(editandoId === procedimento.id ? null : procedimento.id)}
                aria-label={`Editar procedimento ${procedimento.nome}`}
              >
                Editar procedimento
              </button>
              {podeExcluir ? (
                <form action={acaoExcluir} aria-busy={pendenteExcluir}>
                  <input type="hidden" name="id" value={procedimento.id} />
                  <button
                    type="submit"
                    disabled={pendenteExcluir}
                    aria-label={`Excluir procedimento ${procedimento.nome}`}
                  >
                    Excluir procedimento
                  </button>
                </form>
              ) : null}
              {editandoId === procedimento.id ? (
                <form action={acaoEditar} aria-busy={pendenteEditar}>
                  <input type="hidden" name="id" value={procedimento.id} />
                  <Campos procedimento={procedimento} />
                  <button type="submit" disabled={pendenteEditar}>
                    {pendenteEditar ? "Salvando…" : "Salvar procedimento"}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form
        key={cadastro.status === "sucesso" ? cadastro.quando : 0}
        action={acaoCadastrar}
        aria-busy={pendenteCadastrar}
      >
        <Campos />
        <button type="submit" disabled={pendenteCadastrar}>
          {pendenteCadastrar ? "Salvando…" : "Criar procedimento"}
        </button>
      </form>
    </>
  );
}

function resumo(procedimento: Procedimento): string {
  const valor = procedimento.valorMedio.toFixed(2).replace(".", ",");
  return `${procedimento.nome} · ${procedimento.tempoMedioMinutos} min · R$ ${valor}`;
}

function Campos({ procedimento }: { procedimento?: Procedimento }) {
  return (
    <>
      <label>
        Nome
        <input name="nome" defaultValue={procedimento?.nome} required />
      </label>
      <label>
        Tempo médio (minutos)
        <input
          name="tempoMedioMinutos"
          type="number"
          min={1}
          step={1}
          defaultValue={procedimento?.tempoMedioMinutos}
          required
        />
      </label>
      <label>
        Valor médio
        <input
          name="valorMedio"
          type="number"
          min={0}
          step={0.01}
          defaultValue={procedimento?.valorMedio}
          required
        />
      </label>
    </>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem };
}
