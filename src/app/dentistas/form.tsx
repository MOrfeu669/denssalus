"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import type { Dentista } from "../../domain/dentista/tipos";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, editar, remover } from "./actions";
import { Alerta, BotaoAcao } from "./alerta";
import { Campos } from "./campos";
import { DENTISTAS_NOTA, DENTISTAS_VAZIO, mensagemComDetalhe } from "./texto";

export function Dentistas({ dentistas }: { dentistas: Dentista[] }) {
  const roteador = useRouter();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLElement>(null);
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [remocao, acaoRemover] = useActionState(remover, estadoVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const aviso = avisoVisivel(cadastro, edicao, remocao);
  const erroNoPainel = aberto && aviso.status === "erro" && aviso.quando === cadastro.quando;

  useEffect(() => {
    if (edicao.status === "sucesso") setEditandoId(null);
    if (cadastro.status === "sucesso") setAberto(false);
  }, [edicao, cadastro]);

  useEffect(() => {
    const estados = [cadastro, edicao, remocao];
    if (estados.some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, edicao, remocao, roteador]);

  useEffect(() => {
    if (aberto) painelRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !pendenteCadastrar) {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto, pendenteCadastrar]);

  function fechar() {
    if (pendenteCadastrar) return;
    setAberto(false);
    botaoRef.current?.focus();
  }

  return (
    <>
      <div className="dentistas-cabeca">
        <h1>Dentistas</h1>
        <button
          ref={botaoRef}
          type="button"
          className="dentistas-botao"
          aria-haspopup="dialog"
          aria-expanded={aberto}
          aria-controls={aberto ? "dentistas-cadastro" : undefined}
          onClick={() => setAberto(true)}
        >
          Cadastrar dentista
        </button>
      </div>
      {erroNoPainel ? null : (
        <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      )}
      {aberto ? (
        <div className="dentistas-overlay">
          <div className="dentistas-overlay-fundo" onClick={fechar} />
          <section
            ref={painelRef}
            id="dentistas-cadastro"
            className="dentistas-painel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dentistas-novo"
            tabIndex={-1}
          >
            <div className="dentistas-painel-topo">
              <h2 id="dentistas-novo" className="dentistas-subtitulo">
                Cadastrar dentista
              </h2>
              <button type="button" className="dentistas-botao-sec" onClick={fechar}>
                Fechar
              </button>
            </div>
            {erroNoPainel ? (
              <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
            ) : null}
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
        </div>
      ) : null}
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
