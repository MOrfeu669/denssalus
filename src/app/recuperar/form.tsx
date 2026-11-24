"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pedirRecuperacao } from "../auth/actions";
import { estadoVazio } from "../formulario";
import { Alerta } from "./alerta";
import { TEXTO_RECUPERAR as T } from "./texto";

export function FormRecuperar() {
  const [estado, acao, pendente] = useActionState(pedirRecuperacao, estadoVazio);
  const sucesso = estado.status === "sucesso";

  return (
    <form className="recuperar-form" action={acao} aria-busy={pendente}>
      <header className="recuperar-cabecalho">
        <h1 className="recuperar-titulo">{T.titulo}</h1>
        <p className="recuperar-subtitulo">{T.subtitulo}</p>
      </header>

      {pendente ? null : (
        <Alerta status={estado.status} mensagem={estado.mensagem} quando={estado.quando} />
      )}

      {sucesso ? null : (
        <div className="recuperar-campos">
          <div className="recuperar-campo">
            <Label htmlFor="email">{T.rotuloEmail}</Label>
            <Input
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
      )}

      {sucesso ? null : (
        <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={pendente}>
          {pendente ? (
            <span
              className="size-3.5 animate-spin rounded-full border-2 border-transparent border-t-current border-r-current motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : null}
          {pendente ? T.enviando : T.enviar}
        </Button>
      )}

      <Link className="recuperar-voltar" href="/login">
        {T.voltar}
      </Link>
    </form>
  );
}
