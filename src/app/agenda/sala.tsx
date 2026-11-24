"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { AgendamentoNaGrade } from "../../domain/agendamento/tipos";
import { iniciar } from "../agendamentos/actions";
import { estadoVazio } from "../formulario";
import { iniciais } from "./apresentacao";

export function SalaEspera({
  itens,
  nomes,
}: {
  itens: AgendamentoNaGrade[];
  nomes: { pacientes: Record<string, string>; dentistas: Record<string, string> };
}) {
  const roteador = useRouter();
  const alertaRef = useRef<HTMLParagraphElement>(null);
  const [estado, acao, pendente] = useActionState(iniciar, estadoVazio);

  useEffect(() => {
    if (estado.status === "vazio") return;
    alertaRef.current?.focus();
    if (estado.status === "sucesso") roteador.refresh();
  }, [estado.quando, estado.status, roteador]);

  return (
    <section className="rounded-paper-md border border-borda-papel bg-card px-5 py-4 shadow-paper-sm" aria-labelledby="sala-espera">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sala-espera" className="m-0 font-heading text-base leading-6 font-semibold text-tinta">
          Sala de espera
        </h2>
        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-paper-tint-warning px-1.5 text-xs font-medium text-paper-status-em-espera-tinta">
          {itens.length}
        </span>
      </div>
      {estado.status !== "vazio" ? (
        <p
          ref={alertaRef}
          tabIndex={-1}
          role={estado.status === "erro" ? "alert" : "status"}
          className={
            estado.status === "erro"
              ? "mt-3 mb-0 rounded-paper-sm border border-perigo bg-perigo-fundo px-3 py-2 text-sm font-semibold text-perigo-tinta outline-none"
              : "mt-3 mb-0 rounded-paper-sm border border-ok bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok-tinta outline-none"
          }
        >
          {estado.mensagem}
        </p>
      ) : null}
      {itens.length === 0 ? (
        <p className="mt-4 mb-0 text-sm leading-5 text-paper-ink-3">Nenhum paciente na sala de espera.</p>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-4 p-0">
          {itens.map((item) => {
            const paciente = nomes.pacientes[item.pacienteId] ?? item.pacienteId;
            const dentista = nomes.dentistas[item.dentistaId] ?? item.dentistaId;
            const hora = item.inicio.slice(11, 16);
            return (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-tint-warning text-xs font-semibold text-paper-status-em-espera-tinta"
                  aria-hidden="true"
                >
                  {iniciais(paciente)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-tinta">{paciente}</span>
                  <span className="block truncate text-xs leading-4 text-paper-ink-3">
                    {dentista} · {hora}
                  </span>
                </span>
                <form action={acao}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" className="agenda-chamar" disabled={pendente}>
                    {pendente ? "Chamando…" : "Chamar"}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
