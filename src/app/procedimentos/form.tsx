"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import type { Procedimento } from "../../domain/procedimento/tipos";
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
      <AvisoLocal tipo={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      <section className="procedimentos-secao" aria-labelledby="procedimentos-titulo-lista">
        <h2 id="procedimentos-titulo-lista">Procedimentos da clínica</h2>
        {procedimentos.length === 0 ? (
          <p className="procedimentos-vazio">Nenhum procedimento cadastrado nesta clínica.</p>
        ) : (
          <ul className="procedimentos-lista">
            {procedimentos.map((procedimento) => (
              <li key={procedimento.id} className="procedimentos-item">
                <div className="procedimentos-linha">
                  <div className="procedimentos-resumo">
                    <span className="procedimentos-nome">{procedimento.nome}</span>
                    <span className="procedimentos-meta">{meta(procedimento)}</span>
                  </div>
                  <div className="procedimentos-acoes">
                    <button
                      type="button"
                      className="procedimentos-botao procedimentos-botao-secundario"
                      onClick={() => setEditandoId(editandoId === procedimento.id ? null : procedimento.id)}
                      aria-label={`Editar procedimento ${procedimento.nome}`}
                      aria-expanded={editandoId === procedimento.id}
                    >
                      Editar procedimento
                    </button>
                    {podeExcluir ? (
                      <form action={acaoExcluir} aria-busy={pendenteExcluir}>
                        <input type="hidden" name="id" value={procedimento.id} />
                        <button
                          type="submit"
                          className="procedimentos-botao procedimentos-botao-perigo"
                          disabled={pendenteExcluir}
                          aria-label={`Excluir procedimento ${procedimento.nome}`}
                        >
                          Excluir procedimento
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
                {editandoId === procedimento.id ? (
                  <form
                    className="procedimentos-form"
                    action={acaoEditar}
                    aria-busy={pendenteEditar}
                  >
                    <input type="hidden" name="id" value={procedimento.id} />
                    <Campos procedimento={procedimento} />
                    <button
                      type="submit"
                      className="procedimentos-botao"
                      disabled={pendenteEditar}
                    >
                      {pendenteEditar ? "Salvando…" : "Salvar procedimento"}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="procedimentos-secao" aria-labelledby="procedimentos-titulo-novo">
        <h2 id="procedimentos-titulo-novo">Novo procedimento</h2>
        <form
          className="procedimentos-form"
          key={cadastro.status === "sucesso" ? cadastro.quando : 0}
          action={acaoCadastrar}
          aria-busy={pendenteCadastrar}
        >
          <Campos />
          <button
            type="submit"
            className="procedimentos-botao"
            disabled={pendenteCadastrar}
          >
            {pendenteCadastrar ? "Salvando…" : "Criar procedimento"}
          </button>
        </form>
      </section>
    </>
  );
}

function AvisoLocal({
  tipo,
  mensagem,
  quando,
}: {
  tipo: EstadoFormulario["status"];
  mensagem: string;
  quando: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (tipo !== "vazio" && mensagem) ref.current?.focus();
  }, [tipo, mensagem, quando]);

  if (tipo === "vazio" || !mensagem) return null;

  return (
    <p
      ref={ref}
      tabIndex={-1}
      role={tipo === "erro" ? "alert" : "status"}
      className={`procedimentos-aviso procedimentos-aviso-${tipo}`}
    >
      {mensagem}
    </p>
  );
}

function meta(procedimento: Procedimento): string {
  const valor = procedimento.valorMedio.toFixed(2).replace(".", ",");
  return `${procedimento.tempoMedioMinutos} min · R$ ${valor}`;
}

function Campos({ procedimento }: { procedimento?: Procedimento }) {
  return (
    <div className="procedimentos-campos">
      <label className="procedimentos-campo">
        Nome
        <input name="nome" defaultValue={procedimento?.nome} required />
      </label>
      <label className="procedimentos-campo">
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
      <label className="procedimentos-campo">
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
    </div>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem, quando: escolhido.quando };
}
