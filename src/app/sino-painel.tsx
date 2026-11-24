"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Notificacao } from "../domain/notificacao/tipos";
import { Aviso } from "./aviso";
import { estadoVazio } from "./formulario";
import { marcarComoLida } from "./notificacoes/actions";

export function SinoPainel({
  notificacoes,
  erro,
}: {
  notificacoes: Notificacao[];
  erro: string;
}) {
  const roteador = useRouter();
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);
  const [leitura, acaoLer, pendente] = useActionState(marcarComoLida, estadoVazio);
  const mensagem = leitura.detalhe ? `${leitura.mensagem}: ${leitura.detalhe}` : leitura.mensagem;

  const rotulo =
    notificacoes.length > 0
      ? `Notificações, ${notificacoes.length} pendentes`
      : "Notificações";

  useEffect(() => {
    if (!aberto) return;

    function aoTecla(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      setAberto(false);
      botao.current?.focus();
    }

    function aoPonteiro(evento: PointerEvent) {
      const alvo = evento.target;
      if (!(alvo instanceof Node) || raiz.current?.contains(alvo)) return;
      setAberto(false);
    }

    document.addEventListener("keydown", aoTecla);
    document.addEventListener("pointerdown", aoPonteiro);
    return () => {
      document.removeEventListener("keydown", aoTecla);
      document.removeEventListener("pointerdown", aoPonteiro);
    };
  }, [aberto]);

  return (
    <div className="sino" ref={raiz}>
      <button
        ref={botao}
        type="button"
        className="relative grid size-11 cursor-pointer place-items-center rounded-paper-md border border-borda-papel bg-card p-0 text-tinta shadow-paper-sm"
        aria-expanded={aberto}
        aria-controls="sino-painel"
        aria-label={rotulo}
        onClick={() => setAberto((valor) => !valor)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 2.2 a1 1 0 0 1 1 1 v.7 a4.6 4.6 0 0 1 3.6 4.5 v2.2 l1.3 2.1 a.8.8 0 0 1 -.7 1.2 H4.8 a.8.8 0 0 1 -.7-1.2 L5.4 10.6 V8.4 A4.6 4.6 0 0 1 9 3.9 v-.7 a1 1 0 0 1 1-1 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M8.2 15.2 a1.8 1.8 0 0 0 3.6 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        {notificacoes.length > 0 ? (
          <Badge
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] rounded-full bg-perigo px-1 text-[11px] leading-[18px] font-bold text-primary-foreground"
          >
            {notificacoes.length}
          </Badge>
        ) : null}
      </button>
      {aberto ? (
        <section id="sino-painel" className="sino-painel" aria-label="Lista de notificações">
          <Aviso tipo={leitura.status} mensagem={mensagem} />
          {erro ? (
            <>
              <p role="alert" className="erro">
                {erro}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => roteador.refresh()}>
                Tentar de novo
              </Button>
            </>
          ) : notificacoes.length === 0 ? (
            <p className="m-0 text-sm leading-5 text-apagado">Nenhuma notificação pendente.</p>
          ) : (
            <ul className="lista">
              {notificacoes.map((item) => (
                <li key={item.id} className={item.urgencia === "critica" ? "critica" : undefined}>
                  <span>{item.mensagem}</span>
                  {item.urgencia === "normal" ? (
                    <form action={acaoLer} aria-busy={pendente}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" variant="outline" size="sm" disabled={pendente}>
                        Marcar como lida
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
