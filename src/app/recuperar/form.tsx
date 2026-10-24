"use client";

import Link from "next/link";
import { useActionState } from "react";
import { pedirRecuperacao } from "../auth/actions";
import { Aviso } from "../aviso";
import { estadoVazio } from "../formulario";

export function FormRecuperar() {
  const [estado, acao, pendente] = useActionState(pedirRecuperacao, estadoVazio);

  return (
    <form action={acao} aria-busy={pendente}>
      <Aviso tipo={estado.status} mensagem={estado.mensagem} />
      <label>
        E-mail
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <button type="submit" disabled={pendente}>
        {pendente ? "Enviando…" : "Enviar link de recuperação"}
      </button>
      <p className="nav">
        <Link href="/login">Voltar ao login</Link>
      </p>
    </form>
  );
}
