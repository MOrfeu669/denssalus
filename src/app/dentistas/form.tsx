"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { Dentista } from "../../domain/dentista/tipos";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, editar, remover } from "./actions";
import { Alerta, BotaoAcao } from "./alerta";
import { Campos } from "./campos";
import { DENTISTAS_NOTA, DENTISTAS_VAZIO, mensagemComDetalhe } from "./texto";

export function Dentistas({ dentistas }: { dentistas: Dentista[] }) {
  const roteador = useRouter();
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [remocao, acaoRemover] = useActionState(remover, estadoVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const aviso = avisoVisivel(cadastro, edicao, remocao);

  useEffect(() => {
    if (edicao.status === "sucesso") setEditandoId(null);
  }, [edicao]);

  useEffect(() => {
    const estados = [cadastro, edicao, remocao];
    if (estados.some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, edicao, remocao, roteador]);

  return (
    <>
      <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      <section className="dentistas-cartao" aria-labelledby="dentistas-novo">
        <h2 id="dentistas-novo" className="dentistas-subtitulo">
          Cadastrar dentista
        </h2>
        <form action={acaoCadastrar} aria-busy={pendenteCadastrar} className="dentistas-form">
          <Campos />
          <label className="dentistas-campo">
            E-mail
            <input name="email" type="email" autoComplete="off" required />
          </label>
          <label className="dentistas-campo">
            Senha
            <input name="senha" type="password" autoComplete="new-password" minLength={6} required />
          </label>
          <div className="dentistas-acoes">
            <BotaoAcao
              rotulo="Cadastrar dentista"
              pendente="Salvando…"
              className="dentistas-botao"
            />
          </div>
        </form>
        <p className="dentistas-nota">{DENTISTAS_NOTA}</p>
      </section>
      <section className="dentistas-cartao" aria-labelledby="dentistas-lista">
        <h2 id="dentistas-lista" className="dentistas-subtitulo">
          Dentistas da clínica
        </h2>
        {dentistas.length === 0 ? (
          <p className="dentistas-vazio">{DENTISTAS_VAZIO}</p>
        ) : (
          <ul className="dentistas-lista">
            {dentistas.map((dentista) => (
              <li key={dentista.id} className="dentistas-linha">
                <div className="dentistas-topo">
                  <span className="dentistas-pessoa">
                    <span className="dentistas-nome">{dentista.nome}</span>
                    <span className="dentistas-cro">CRO {dentista.cro}</span>
                    <span
                      className={dentista.ativo ? "dentistas-ativo" : "dentistas-inativo"}
                    >
                      {dentista.ativo ? "Ativo" : "! Removido"}
                    </span>
                    <span className="dentistas-detalhe">
                      {dentista.telefone}
                      {dentista.especialidades.length > 0
                        ? ` · ${dentista.especialidades.join(", ")}`
                        : ""}
                    </span>
                  </span>
                  {dentista.ativo ? (
                    <span className="dentistas-linha-acoes">
                      <button
                        type="button"
                        className="dentistas-botao-sec"
                        aria-expanded={editandoId === dentista.id}
                        aria-label={`Editar dentista ${dentista.nome}`}
                        onClick={() =>
                          setEditandoId(editandoId === dentista.id ? null : dentista.id)
                        }
                      >
                        Editar
                      </button>
                      <form action={acaoRemover} className="dentistas-remover">
                        <input type="hidden" name="id" value={dentista.id} />
                        <BotaoAcao
                          rotulo="Remover"
                          pendente="Removendo…"
                          className="dentistas-botao-sec"
                          nomeAcessivel={`Remover dentista ${dentista.nome}`}
                        />
                      </form>
                    </span>
                  ) : null}
                </div>
                {dentista.ativo && editandoId === dentista.id ? (
                  <form
                    action={acaoEditar}
                    aria-busy={pendenteEditar}
                    className="dentistas-form dentistas-edicao"
                  >
                    <input type="hidden" name="id" value={dentista.id} />
                    <Campos dentista={dentista} />
                    <div className="dentistas-acoes">
                      <BotaoAcao
                        rotulo="Salvar dentista"
                        pendente="Salvando…"
                        className="dentistas-botao"
                      />
                    </div>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  return {
    status: escolhido.status,
    mensagem: mensagemComDetalhe(escolhido.mensagem, escolhido.detalhe),
    quando: escolhido.quando,
  };
}
