"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { definirSenha } from "../../auth/actions";
import { estadoVazio } from "../../formulario";
import { IconeCadeado } from "../../login/icones";
import { Alerta } from "../alerta";
import { confirmacaoConfere } from "../confirmacao";
import { TEXTO_NOVA_SENHA as T } from "../texto";

type ErroLocal = { mensagem: string; quando: number };

export function FormNovaSenha() {
  const [estado, acao, pendente] = useActionState(definirSenha, estadoVazio);
  const [erroLocal, setErroLocal] = useState<ErroLocal | null>(null);
  const sucesso = estado.status === "sucesso";

  // A confirmação é só da tela: a action definirSenha lê apenas `senha`.
  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    const dados = new FormData(evento.currentTarget);
    const senha = String(dados.get("senha") ?? "");
    const confirmacao = String(dados.get("confirmacao") ?? "");
    if (confirmacaoConfere(senha, confirmacao)) {
      setErroLocal(null);
      return;
    }
    evento.preventDefault();
    setErroLocal({ mensagem: T.confirmacaoDiferente, quando: Date.now() });
  }

  const aviso = erroLocal
    ? { status: "erro" as const, ...erroLocal }
    : { status: estado.status, mensagem: estado.mensagem, quando: estado.quando };

  return (
    <form className="entrar-form" action={acao} onSubmit={aoEnviar} aria-busy={pendente}>
      <header className="entrar-cabecalho">
        <h1 className="entrar-titulo">{T.titulo}</h1>
        <p className="entrar-subtitulo">{T.subtitulo}</p>
      </header>

      {pendente ? null : (
        <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      )}

      {sucesso ? null : (
        <div className="entrar-campos">
          <div className="entrar-campo">
            <label htmlFor="senha">{T.rotuloSenha}</label>
            <div className="entrar-caixa">
              <IconeCadeado />
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="new-password"
                placeholder={T.placeholderSenha}
                minLength={6}
                required
                readOnly={pendente}
              />
            </div>
          </div>
          <div className="entrar-campo">
            <label htmlFor="confirmacao">{T.rotuloConfirmacao}</label>
            <div className="entrar-caixa">
              <IconeCadeado />
              <input
                id="confirmacao"
                name="confirmacao"
                type="password"
                autoComplete="new-password"
                placeholder={T.placeholderConfirmacao}
                minLength={6}
                required
                readOnly={pendente}
              />
            </div>
          </div>
        </div>
      )}

      {sucesso ? (
        <Link className="entrar-botao" href="/login">
          {T.entrar}
        </Link>
      ) : (
        <button className="entrar-botao" type="submit" disabled={pendente}>
          {pendente ? <span className="entrar-spinner" aria-hidden="true" /> : null}
          {pendente ? T.salvando : T.salvar}
        </button>
      )}
    </form>
  );
}
