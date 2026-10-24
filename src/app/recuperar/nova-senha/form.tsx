"use client";

import Link from "next/link";
import { useActionState } from "react";
import { definirSenha } from "../../auth/actions";
import { Aviso } from "../../aviso";
import { estadoVazio } from "../../formulario";

export function FormNovaSenha() {
  const [estado, acao, pendente] = useActionState(definirSenha, estadoVazio);

  return (
    <form action={acao} aria-busy={pendente}>
      <Aviso tipo={estado.status} mensagem={estado.mensagem} />
      <label>
        Nova senha
        <input name="senha" type="password" autoComplete="new-password" minLength={6} required />
      </label>
      <button type="submit" disabled={pendente}>
        {pendente ? "Salvando…" : "Definir nova senha"}
      </button>
      {estado.status === "sucesso" ? (
        <p className="nav">
          <Link className="acao" href="/login">
            Entrar
          </Link>
        </p>
      ) : null}
    </form>
  );
}
