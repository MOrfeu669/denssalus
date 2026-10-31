"use client";

import Link from "next/link";
import { useActionState } from "react";
import { pedirRecuperacao } from "../auth/actions";
import { estadoVazio } from "../formulario";
import { IconeEmail } from "../login/icones";
import { Alerta } from "./alerta";
import { TEXTO_RECUPERAR as T } from "./texto";

export function FormRecuperar() {
  const [estado, acao, pendente] = useActionState(pedirRecuperacao, estadoVazio);
  const sucesso = estado.status === "sucesso";

  return (
    <form className="entrar-form" action={acao} aria-busy={pendente}>
      <header className="entrar-cabecalho">
        <h1 className="entrar-titulo">{T.titulo}</h1>
        <p className="entrar-subtitulo">{T.subtitulo}</p>
      </header>

      {pendente ? null : (
        <Alerta status={estado.status} mensagem={estado.mensagem} quando={estado.quando} />
      )}

      {sucesso ? null : (
        <div className="entrar-campos">
          <div className="entrar-campo">
            <label htmlFor="email">{T.rotuloEmail}</label>
            <div className="entrar-caixa">
              <IconeEmail />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder={T.placeholderEmail}
                required
                readOnly={pendente}
              />
            </div>
          </div>
        </div>
      )}

      {sucesso ? null : (
        <button className="entrar-botao" type="submit" disabled={pendente}>
          {pendente ? <span className="entrar-spinner" aria-hidden="true" /> : null}
          {pendente ? T.enviando : T.enviar}
        </button>
      )}

      <Link className="recuperar-voltar" href="/login">
        {T.voltar}
      </Link>
    </form>
  );
}
