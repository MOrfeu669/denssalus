"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { entrar } from "../auth/actions";
import { estadoVazio } from "../formulario";
import { IconeCadeado, IconeEmail, IconeErro, IconeEscudo, IconeOk, IconeOlho } from "./icones";

export function FormLogin() {
  const [estado, acao, pendente] = useActionState(entrar, estadoVazio);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const avisoRef = useRef<HTMLDivElement>(null);
  const sucesso = estado.status === "sucesso";
  const mostrarAviso = !pendente && estado.status !== "vazio" && Boolean(estado.mensagem);

  useEffect(() => {
    if (mostrarAviso) avisoRef.current?.focus();
  }, [mostrarAviso, estado.mensagem, estado.quando]);

  return (
    <form className="entrar-form" action={acao} aria-busy={pendente}>
      <header className="entrar-cabecalho">
        <h1 className="entrar-titulo">Entrar</h1>
        <p className="entrar-subtitulo">Acesse com o e-mail e a senha cadastrados pela clínica.</p>
      </header>

      {mostrarAviso ? (
        <div
          ref={avisoRef}
          tabIndex={-1}
          role={estado.status === "erro" ? "alert" : "status"}
          className={`entrar-alerta entrar-alerta-${estado.status}`}
        >
          {estado.status === "erro" ? <IconeErro /> : <IconeOk cor="#178A4C" />}
          <div className="entrar-alerta-texto">
            <strong>{estado.mensagem}</strong>
            {estado.detalhe ? <p>{estado.detalhe}</p> : null}
          </div>
        </div>
      ) : null}

      {sucesso ? null : (
        <div className="entrar-campos">
          <div className="entrar-campo">
            <label htmlFor="email">E-mail</label>
            <div className="entrar-caixa">
              <IconeEmail />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nome@clinica.com.br"
                required
                disabled={pendente}
              />
            </div>
          </div>
          <div className="entrar-campo">
            <label htmlFor="senha">Senha</label>
            <div className="entrar-caixa">
              <IconeCadeado />
              <input
                id="senha"
                name="senha"
                type={senhaVisivel ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                required
                disabled={pendente}
              />
              <button
                type="button"
                className="entrar-olho"
                aria-pressed={senhaVisivel}
                aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setSenhaVisivel((valor) => !valor)}
                disabled={pendente}
              >
                <IconeOlho />
              </button>
            </div>
          </div>
        </div>
      )}

      {sucesso ? null : (
        <Link className="entrar-esqueci" href="/recuperar">
          Esqueci a senha
        </Link>
      )}

      {sucesso ? (
        <Link className="entrar-botao" href="/">
          Continuar
        </Link>
      ) : (
        <button className="entrar-botao" type="submit" disabled={pendente}>
          {pendente ? <span className="entrar-spinner" aria-hidden="true" /> : null}
          {pendente ? "Entrando…" : "Entrar"}
        </button>
      )}

      {sucesso ? null : (
        <p className="entrar-nota">
          <IconeEscudo />
          <span>Você continuará conectado até sair.</span>
        </p>
      )}
    </form>
  );
}
