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

  return (
    <div className="sino">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls="sino-painel"
        onClick={() => setAberto((valor) => !valor)}
      >
        Notificações
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
