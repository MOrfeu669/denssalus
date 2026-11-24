"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deslocarMes, diasDoMes, LETRAS_SEMANA, nomeMesAno } from "./apresentacao";

export function MiniCalendario({
  data,
  ocupados,
  onEscolher,
}: {
  data: string;
  ocupados: ReadonlySet<string>;
  onEscolher: (iso: string) => void;
}) {
  const [ano, setAno] = useState(() => Number(data.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(data.slice(5, 7)));

  useEffect(() => {
    setAno(Number(data.slice(0, 4)));
    setMes(Number(data.slice(5, 7)));
  }, [data]);

  const dias = diasDoMes(ano, mes);

  function mudar(delta: number) {
    const proximo = deslocarMes(ano, mes, delta);
    setAno(proximo.ano);
    setMes(proximo.mes);
  }

  return (
    <section className="rounded-paper-md border border-borda-papel bg-card px-4 py-4 shadow-paper-sm" aria-label="Calendário">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 font-heading text-base leading-6 font-semibold text-tinta">{nomeMesAno(ano, mes)}</h2>
        <div className="flex">
          <Button type="button" className="agenda-seta" aria-label="Mês anterior" onClick={() => mudar(-1)}>
            <ChevronLeft className="size-[18px]" aria-hidden="true" />
          </Button>
          <Button type="button" className="agenda-seta" aria-label="Próximo mês" onClick={() => mudar(1)}>
            <ChevronRight className="size-[18px]" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7">
        {LETRAS_SEMANA.map((letra, indice) => (
          <span key={`${letra}-${indice}`} className="py-1 text-center font-mono text-[11px] tracking-wide text-paper-ink-3 uppercase">
            {letra}
          </span>
        ))}
        {dias.map((dia) => {
          const escolhido = dia.iso === data;
          const ocupado = ocupados.has(dia.iso) && !escolhido;
          return (
            <span key={dia.iso} className="relative flex h-10 items-start justify-center">
              <Button
                type="button"
                className={cn("agenda-dia tabular-nums", !escolhido && dia.domingo && "text-[#A3A193]")}
                aria-pressed={escolhido}
                aria-label={`${dia.dia} de ${nomeMesAno(ano, mes)}`}
                onClick={() => onEscolher(dia.iso)}
              >
                {dia.dia}
              </Button>
              {ocupado ? (
                <span className="absolute bottom-1 size-1 rounded-full bg-paper-status-agendado" aria-hidden="true" />
              ) : null}
            </span>
          );
        })}
      </div>
    </section>
  );
}
