"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { entrar } from "../auth/actions";
import { estadoVazio } from "../formulario";
import { IconeCadeado, IconeEmail, IconeErro, IconeEscudo, IconeOk, IconeOlho } from "./icones";

const botaoEntrar =
  "h-12 w-full rounded-[10px] border-0 bg-acao text-base leading-6 font-semibold text-white shadow-none hover:bg-marca active:translate-y-0 disabled:bg-acao disabled:opacity-100";

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
    <form className="flex w-full max-w-[400px] flex-col gap-6" action={acao} aria-busy={pendente}>
      <header className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[28px] leading-9 font-bold tracking-[-0.005em] text-tinta">Entrar</h1>
        <p className="m-0 text-sm leading-5 font-normal text-apagado">
          Acesse com o e-mail e a senha cadastrados pela clínica.
        </p>
      </header>

      {mostrarAviso ? (
        <div
          ref={avisoRef}
          tabIndex={-1}
          role={estado.status === "erro" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-3 rounded-[14px] border p-4 focus:outline-2 focus:outline-offset-[3px] focus:outline-[#1fa08e]",
            estado.status === "erro"
              ? "border-perigo bg-perigo-fundo"
              : "border-ok bg-ok-fundo",
          )}
        >
          {estado.status === "erro" ? <IconeErro /> : <IconeOk cor="#178A4C" />}
          <div className="flex min-w-0 flex-col gap-0.5">
            <strong
              className={cn(
                "text-sm leading-5 font-semibold",
                estado.status === "erro" ? "text-perigo-tinta" : "text-ok-tinta",
              )}
            >
              {estado.mensagem}
            </strong>
            {estado.detalhe ? <p className="m-0 text-[13px] leading-[18px] font-normal text-apagado">{estado.detalhe}</p> : null}
          </div>
        </div>
      ) : null}

      {sucesso ? null : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm leading-5 font-semibold text-tinta" htmlFor="email">
              E-mail
            </label>
            <div className="flex h-11 items-center gap-2.5 rounded-[10px] border border-linha bg-white px-3.5 focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-marca">
              <IconeEmail />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nome@clinica.com.br"
                required
                disabled={pendente}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-5 font-normal text-tinta outline-none placeholder:text-placeholder focus-visible:outline-none [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm leading-5 font-semibold text-tinta" htmlFor="senha">
              Senha
            </label>
            <div className="flex h-11 items-center gap-2.5 rounded-[10px] border border-linha bg-white px-3.5 focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-marca">
              <IconeCadeado />
              <input
                id="senha"
                name="senha"
                type={senhaVisivel ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                required
                disabled={pendente}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-5 font-normal text-tinta outline-none placeholder:text-placeholder focus-visible:outline-none [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
              />
              <button
                type="button"
                className="grid size-[18px] place-items-center border-0 bg-transparent p-0 text-placeholder"
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
        <Link className="self-end text-xs leading-4 font-semibold text-link no-underline" href="/recuperar">
          Esqueci a senha
        </Link>
      )}

      {sucesso ? (
        <Link className={cn(buttonVariants({ variant: "default" }), botaoEntrar)} href="/">
          Continuar
        </Link>
      ) : (
        <Button type="submit" className={botaoEntrar} disabled={pendente}>
          {pendente ? (
            <span
              className="size-[15px] animate-spin rounded-full border-[1.667px] border-transparent border-t-white border-r-white motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : null}
          {pendente ? "Entrando…" : "Entrar"}
        </Button>
      )}

      {sucesso ? null : (
        <p className="m-0 flex items-center justify-center gap-2 text-xs leading-4 font-normal text-placeholder">
          <IconeEscudo />
          <span>Você continuará conectado até sair.</span>
        </p>
      )}
    </form>
  );
}
