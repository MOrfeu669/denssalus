"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { definirSenha } from "../../auth/actions";
import { estadoVazio } from "../../formulario";
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
    <form className="recuperar-form" action={acao} onSubmit={aoEnviar} aria-busy={pendente}>
      <header className="recuperar-cabecalho">
        <h1 className="recuperar-titulo">{T.titulo}</h1>
        <p className="recuperar-subtitulo">{T.subtitulo}</p>
      </header>

      {pendente ? null : (
        <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      )}

      {sucesso ? null : (
        <div className="recuperar-campos">
          <div className="recuperar-campo">
            <Label htmlFor="senha">{T.rotuloSenha}</Label>
            <Input
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
          <div className="recuperar-campo">
            <Label htmlFor="confirmacao">{T.rotuloConfirmacao}</Label>
            <Input
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
      )}

      {sucesso ? (
        <Link
          className={cn(buttonVariants({ variant: "default" }), "h-11 w-full text-base font-semibold")}
          href="/login"
        >
          {T.entrar}
        </Link>
      ) : (
        <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={pendente}>
          {pendente ? (
            <span
              className="size-3.5 animate-spin rounded-full border-2 border-transparent border-t-current border-r-current motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : null}
          {pendente ? T.salvando : T.salvar}
        </Button>
      )}
    </form>
  );
}
