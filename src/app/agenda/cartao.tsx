import { Check } from "lucide-react";
import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { BadgeStatus } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgendamentoNaGrade, StatusAgendamento } from "../../domain/agendamento/tipos";
import { horarioDoDia } from "../agendamentos/texto";
import { CORES_DENTISTA } from "./apresentacao";
import type { VisaoGrade } from "./posicao";
import { rotuloStatus } from "./rotulo";

type Nomes = {
  pacientes: Record<string, string>;
  dentistas: Record<string, string>;
  cadeiras: Record<string, string>;
  procedimentos: Record<string, string>;
};

const DIA: Record<StatusAgendamento, { caixa: string; titulo: string; apoio: string; faixa: string }> = {
  agendado: {
    caixa: "bg-paper-tint-agendado",
    titulo: "text-[#3B0764]",
    apoio: "text-paper-status-agendado-tinta",
    faixa: "bg-paper-status-agendado",
  },
  em_espera: {
    caixa: "bg-paper-tint-em-espera",
    titulo: "text-[#78350F]",
    apoio: "text-paper-status-em-espera-tinta",
    faixa: "bg-paper-status-em-espera",
  },
  iniciado: {
    caixa: "bg-paper-tint-iniciado shadow-paper-md",
    titulo: "text-white",
    apoio: "text-paper-status-iniciado-apoio",
    faixa: "bg-paper-secondary",
  },
  concluido: {
    caixa: "bg-paper-tint-concluido",
    titulo: "text-[#14532D]",
    apoio: "text-[#3F6B4E]",
    faixa: "bg-paper-status-concluido",
  },
  cancelado: {
    caixa: "border border-borda-papel bg-paper-tint-cancelado",
    titulo: "text-paper-status-cancelado line-through font-normal",
    apoio: "text-paper-status-cancelado line-through",
    faixa: "bg-paper-status-cancelado-faixa",
  },
};

const COM_BADGE = new Set<StatusAgendamento>(["agendado", "em_espera", "iniciado", "concluido", "cancelado"]);

export function Cartao({
  item,
  topo,
  altura,
  visao,
  nomes,
  href,
  corIndice,
  trilho,
  podeMover,
  arrastando,
  onComecar,
  consumirClique,
}: {
  item: AgendamentoNaGrade;
  topo: number;
  altura: number;
  visao: VisaoGrade;
  nomes: Nomes;
  href: string;
  corIndice: number;
  trilho?: { indice: number; total: number };
  podeMover: boolean;
  arrastando: boolean;
  onComecar: (evento: ReactPointerEvent<HTMLElement>, modo: "mover" | "alongar") => void;
  consumirClique: () => boolean;
}) {
  const paciente = nomes.pacientes[item.pacienteId] ?? item.pacienteId;
  const dentista = nomes.dentistas[item.dentistaId] ?? item.dentistaId;
  const cadeira = nomes.cadeiras[item.cadeiraId] ?? item.cadeiraId;
  const procedimento = item.procedimentoId ? (nomes.procedimentos[item.procedimentoId] ?? "") : "";
  const horario = horarioDoDia(item.inicio, item.fim);
  const horaInicio = item.inicio.slice(11, 16);
  const visual = DIA[item.status];
  const cor = CORES_DENTISTA[corIndice % CORES_DENTISTA.length];
  const semanaIniciado = visao === "semana" && item.status === "iniciado";
  const alto = altura >= 76;
  return (
    <Link
      href={href}
      data-status={item.status}
      className={cn(
        "agenda-evento absolute z-10 flex flex-col overflow-hidden rounded-controle px-2.5 py-1.5 text-[13px] leading-[18px] no-underline",
        trilho && trilho.total > 1 ? "right-auto" : "right-1 left-1",
        visao === "dia" ? visual.caixa : "shadow-none",
        item.status === "cancelado" && visao === "semana" && "border border-borda-papel",
        podeMover && "cursor-grab touch-none",
        arrastando && "cursor-grabbing",
      )}
      style={{
        top: topo + 2,
        height: Math.max(altura - 4, 1),
        left: trilho && trilho.total > 1 ? `calc(${(trilho.indice / trilho.total) * 100}% + 2px)` : undefined,
        width: trilho && trilho.total > 1 ? `calc(${100 / trilho.total}% - 4px)` : undefined,
        background: visao === "semana" ? (semanaIniciado ? "#111111" : item.status === "cancelado" ? "#FFFFFF" : cor.fill) : undefined,
        color: visao === "semana" ? (semanaIniciado ? "#FFFFFF" : cor.texto) : undefined,
      }}
      draggable={false}
      aria-label={`${horario}, ${paciente}, ${dentista}, ${cadeira}, ${rotuloStatus(item.status)}${item.alerta ? ", alerta" : ""}`}
      onPointerDown={(evento) => {
        if (!podeMover) return;
        onComecar(evento, "mover");
      }}
      onClick={(evento) => {
        if (consumirClique()) {
          evento.preventDefault();
          return;
        }
        const avisar = () => {
          if (window.location.hash.length > 1) window.dispatchEvent(new HashChangeEvent("hashchange"));
        };
        queueMicrotask(avisar);
        requestAnimationFrame(avisar);
      }}
    >
      <span
        className={cn("absolute top-0 bottom-0 left-0 w-[3px]", visao === "dia" && visual.faixa)}
        style={{ background: visao === "semana" ? (item.status === "cancelado" ? "#C9C8BA" : cor.stripe) : undefined }}
        aria-hidden="true"
      />
      {visao === "semana" ? (
        <>
          <span className={cn("truncate pl-1.5 text-xs font-medium", item.status === "cancelado" && "line-through")}>
            {paciente}
          </span>
          {altura >= 40 ? (
            <span className={cn("truncate pl-1.5 text-[11px] leading-[14px] opacity-80", item.status === "cancelado" && "line-through")}>
              {procedimento ? `${horaInicio} · ${procedimento}` : horaInicio}
            </span>
          ) : null}
          {item.status === "concluido" ? (
            <>
              <span className="pointer-events-none absolute inset-0 bg-white/45" aria-hidden="true" />
              <Check className="absolute top-1.5 right-1.5 size-3.5 text-paper-status-concluido" aria-hidden="true" strokeWidth={2.25} />
            </>
          ) : null}
        </>
      ) : (
        <>
          <span className={cn("truncate pl-1.5 font-medium", visual.titulo)}>{paciente}</span>
          {procedimento ? <span className={cn("truncate pl-1.5 text-xs leading-4", visual.apoio)}>{procedimento}</span> : null}
          <span className="mt-auto flex items-end justify-between gap-1 pl-1.5">
            <span className={cn("font-mono text-[11px] leading-4 tracking-wide", visual.apoio)}>{horario}</span>
            {alto && COM_BADGE.has(item.status) ? <BadgeStatus status={item.status} /> : null}
          </span>
        </>
      )}
      {item.alerta ? (
        <span className="pl-1.5 text-xs font-bold text-perigo">
          <span aria-hidden="true">! </span>
          {item.textoAlerta ?? "Alerta"}
        </span>
      ) : null}
      {podeMover ? (
        <span
          data-alca="fim"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Alterar a duração"
          className="absolute inset-x-0 bottom-0 z-20 flex h-2.5 cursor-ns-resize items-end justify-center pb-0.5"
          onPointerDown={(evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            onComecar(evento, "alongar");
          }}
          onClick={(evento) => {
            evento.preventDefault();
            evento.stopPropagation();
          }}
        >
          <span className="h-0.5 w-6 rounded-full bg-current opacity-40" aria-hidden="true" />
        </span>
      ) : null}
    </Link>
  );
}

export function Bloqueio({
  inicio,
  fim,
  motivo,
  dentista,
  visao,
  topo,
  altura,
}: {
  inicio: string;
  fim: string;
  motivo: string | null;
  dentista: string;
  visao: VisaoGrade;
  topo: number;
  altura: number;
}) {
  const horario = horarioDoDia(inicio, fim);
  const texto = [visao === "semana" ? dentista : null, horario, motivo].filter(Boolean).join(" · ");
  return (
    <div
      className="agenda-bloqueio absolute right-1 left-1 z-10 flex flex-col justify-center overflow-hidden rounded-controle border-l-[3px] border-tinta px-2 py-1 text-xs leading-4 text-tinta"
      style={{ top: topo + 1, height: Math.max(altura - 2, 1) }}
      aria-label={`Bloqueio, ${texto}`}
    >
      <span className="font-semibold">Bloqueio</span>
      <span className="truncate">{texto}</span>
    </div>
  );
}
