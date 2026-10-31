"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
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
  const [aberto, setAberto] = useState(false);
  const [leitura, acaoLer, pendente] = useActionState(marcarComoLida, estadoVazio);
  const mensagem = leitura.detalhe ? `${leitura.mensagem}: ${leitura.detalhe}` : leitura.mensagem;

  const rotulo =
    notificacoes.length > 0
      ? `Notificações, ${notificacoes.length} pendentes`
      : "Notificações";

  return (
    <div className="sino">
      <button
        type="button"
        className="sino-botao"
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
          <span className="sino-contagem">{notificacoes.length}</span>
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
              <button type="button" onClick={() => roteador.refresh()}>
                Tentar de novo
              </button>
            </>
          ) : notificacoes.length === 0 ? (
            <p>Nenhuma notificação pendente.</p>
          ) : (
            <ul className="lista">
              {notificacoes.map((item) => (
                <li key={item.id} className={item.urgencia === "critica" ? "critica" : undefined}>
                  <span>{item.mensagem}</span>
                  {item.urgencia === "normal" ? (
                    <form action={acaoLer} aria-busy={pendente}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" disabled={pendente}>
                        Marcar como lida
                      </button>
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
