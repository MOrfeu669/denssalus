"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { pedirOverlay } from "../agendamentos/pedido";
import { AVATARES, iniciais, rotuloColunaSemana, rotuloContagem } from "./apresentacao";
import type { VisaoGrade } from "./posicao";
import { intervaloEntreMinutos } from "./slot";

export function CabecalhoDia({ nome, subtitulo, indice }: { nome: string; subtitulo: string; indice: number }) {
  const cor = AVATARES[indice % AVATARES.length];
  return (
    <div className="flex h-[72px] min-w-0 items-center gap-3 border-b border-borda-papel px-3.5">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full font-heading text-xs font-semibold"
        style={{ background: cor.fundo, color: cor.tinta }}
        aria-hidden="true"
      >
        {iniciais(nome)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-tinta">{nome}</span>
        {subtitulo ? <span className="block truncate text-xs leading-4 text-paper-ink-3">{subtitulo}</span> : null}
      </span>
    </div>
  );
}

export function CabecalhoSemana({ id, hoje, consultas }: { id: string; hoje: string; consultas: number }) {
  const rotulo = rotuloColunaSemana(id);
  const atual = id === hoje;
  return (
    <div className={cn("flex h-16 min-w-0 items-center gap-3 border-b border-borda-papel px-4", atual && "bg-[#FAF8FF]")}>
      <span>
        <span className={cn("block font-mono text-[11px] tracking-wide uppercase", atual ? "text-link" : "text-paper-ink-3")}>
          {rotulo.sigla}
        </span>
        {atual ? (
          <span className="mt-0.5 grid size-7 place-items-center rounded-full bg-destaque font-heading text-base font-semibold text-white">
            {rotulo.numero}
          </span>
        ) : (
          <span className="mt-0.5 block font-heading text-xl leading-6 font-semibold text-tinta">{rotulo.numero}</span>
        )}
      </span>
      <span className="text-xs leading-4 text-paper-ink-3">{rotuloContagem(consultas, "consulta", "consultas")}</span>
    </div>
  );
}

export function Hora({
  visao,
  data,
  hora,
  primeiraHora,
  pxHora,
  indice,
  nome,
  dentistaId,
  cadeiraId,
  fora,
}: {
  visao: VisaoGrade;
  data: string;
  hora: number;
  primeiraHora: number;
  pxHora: number;
  indice: number;
  nome: string;
  dentistaId: string;
  cadeiraId: string;
  fora: boolean;
}) {
  return (
    <>
      {indice > 0 ? (
        <span className="pointer-events-none absolute right-0 left-0 z-[1] h-px bg-[#EDEDE3]" style={{ top: indice * pxHora }} />
      ) : null}
      <span
        className="pointer-events-none absolute right-0 left-0 z-[1] border-t border-dashed border-[#EFEFE6]"
        style={{ top: indice * pxHora + pxHora / 2 }}
      />
      {[0, 30].map((minuto) => {
        const inicioMin = hora * 60 + minuto;
        const rotulo = `${String(hora).padStart(2, "0")}:${minuto === 0 ? "00" : "30"}`;
        const intervalo = intervaloEntreMinutos(data, inicioMin, inicioMin + 30);
        return (
          <button
            key={minuto}
            type="button"
            className={cn("agenda-slot absolute right-0 left-0 z-0", fora && "agenda-fora")}
            style={{ top: (inicioMin - primeiraHora * 60) * (pxHora / 60), height: pxHora / 2 }}
            aria-label={
              visao === "dia"
                ? `Encaixar às ${rotulo} com ${nome}`
                : `Encaixar às ${rotulo} em ${data.slice(8, 10)}/${data.slice(5, 7)}`
            }
            onClick={(evento) => {
              if (!intervalo) return;
              pedirOverlay({
                destino: "novo",
                origem: evento.currentTarget,
                slot: { inicio: intervalo.inicio, fim: intervalo.fim, dentistaId, cadeiraId },
              });
            }}
          >
            <span className="agenda-encaixe pointer-events-none absolute inset-x-1.5 inset-y-1 flex items-center gap-1 rounded-controle border border-dashed border-paper-status-agendado px-2 text-xs font-medium text-link">
              <Plus className="size-3.5" aria-hidden="true" />
              Encaixar às {rotulo}
            </span>
          </button>
        );
      })}
    </>
  );
}

export function rotuloHora(hora: number) {
  return `${String(hora).padStart(2, "0")}:00`;
}
