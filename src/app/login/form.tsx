"use client";

import Link from "next/link";
import { useActionState } from "react";
import { entrar } from "../auth/actions";
import { Aviso } from "../aviso";
import { estadoVazio } from "../formulario";

export function FormLogin() {
  const [estado, acao, pendente] = useActionState(entrar, estadoVazio);

  return (
    <form action={acao} aria-busy={pendente}>
      <Aviso tipo={estado.status} mensagem={estado.mensagem} />
      {estado.detalhe ? <p>{estado.detalhe}</p> : null}
      <label>
        E-mail
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Senha
        <input name="senha" type="password" autoComplete="current-password" required />
      </label>
      <button type="submit" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar"}
      </button>
      {estado.status === "sucesso" ? (
        <p className="nav">
          <Link className="acao" href="/">
            Continuar
          </Link>
        </p>
      ) : (
        <p className="nav">
          <Link href="/recuperar">Esqueci a senha</Link>
        </p>
      )}
    </form>
  );
}
