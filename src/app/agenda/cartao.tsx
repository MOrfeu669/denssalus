import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgendamentoNaGrade, StatusAgendamento } from "../../domain/agendamento/tipos";
import { horarioDoDia } from "../agendamentos/texto";
import type { VisaoGrade } from "./posicao";
import { rotuloStatus, varianteStatus } from "./rotulo";

type Nomes = {
  pacientes: Record<string, string>;
  dentistas: Record<string, string>;
  cadeiras: Record<string, string>;
};

const CORES: Record<StatusAgendamento, string> = {
  agendado: "border-borda-papel border-l-primary bg-card",
  em_espera: "border-aviso bg-aviso-fundo",
  iniciado: "border-primary bg-secondary",
  concluido: "border-ok bg-ok-fundo",
  cancelado: "border-borda-papel bg-papel",
};

export function Cabecalho({
  visao,
  id,
  nome,
  hoje,
}: {
  visao: VisaoGrade;
  id: string;
  nome: string;
  hoje: string;
}) {
  if (visao === "semana") {
    const rotulo = rotuloDoDia(id);
    return (
      <div className="flex items-center gap-2 border-b border-borda-papel px-3 py-2">
        <div>
          <p className="m-0 font-heading text-sm leading-4 font-semibold text-tinta">{rotulo.nome}</p>
          <p className="m-0 text-xs leading-4 text-apagado">{rotulo.sub}</p>
        </div>
        {id === hoje ? (
          <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
            Hoje
          </Badge>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 border-b border-borda-papel bg-papel px-3 py-3">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-paper-sm border border-borda-papel bg-card text-[11px] font-bold text-tinta"
        aria-hidden="true"
      >
        {iniciais(nome)}
      </span>
      <span className="truncate text-sm leading-4 font-semibold text-tinta">{nome}</span>
    </div>
  );
}

export function Cartao({
  item,
  faixa,
  visao,
  nomes,
  href,
  podeMover,
  arrastando,
  onComecar,
  consumirClique,
}: {
  item: AgendamentoNaGrade;
  faixa: { topoMinutos: number; alturaMinutos: number };
  visao: VisaoGrade;
  nomes: Nomes;
  href: string;
  podeMover: boolean;
  arrastando: boolean;
  onComecar: (evento: ReactPointerEvent<HTMLElement>, modo: "mover" | "alongar") => void;
  consumirClique: () => boolean;
}) {
  const paciente = nomes.pacientes[item.pacienteId] ?? item.pacienteId;
  const dentista = nomes.dentistas[item.dentistaId] ?? item.dentistaId;
  const cadeira = nomes.cadeiras[item.cadeiraId] ?? item.cadeiraId;
  const horario = horarioDoDia(item.inicio, item.fim);
  const visual = item.alerta ? "border-aviso bg-aviso-fundo" : CORES[item.status];
  const detalhe = visao === "dia" ? `${horario} · ${cadeira}` : `${horario} · ${dentista} · ${cadeira}`;
  return (
    <Link
      href={href}
      className={cn(
        "absolute right-1 left-1 z-10 flex flex-col gap-0.5 overflow-hidden rounded-paper-sm border border-l-4 px-2 py-1 text-xs leading-4 text-tinta no-underline shadow-paper-sm",
        visual,
        podeMover && "cursor-grab touch-none",
        arrastando && "cursor-grabbing",
      )}
      style={{ top: faixa.topoMinutos + 1, height: Math.max(faixa.alturaMinutos - 2, 1) }}
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
          if (window.location.hash.length > 1) {
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          }
        };
        queueMicrotask(avisar);
        requestAnimationFrame(avisar);
      }}
    >
      <span className="flex items-start justify-between gap-1">
        <span className={cn("truncate font-bold", item.status === "cancelado" && "line-through")}>{paciente}</span>
        <Badge variant={item.alerta ? "warning" : varianteStatus(item.status)} className="h-5 px-1.5 text-[11px]">
          {rotuloStatus(item.status)}
        </Badge>
      </span>
      <span className={cn("truncate text-apagado", item.status === "cancelado" && "line-through")}>{detalhe}</span>
      {item.alerta ? (
        <span className="font-bold text-perigo-tinta">
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
  faixa,
}: {
  inicio: string;
  fim: string;
  motivo: string | null;
  dentista: string;
  visao: VisaoGrade;
  faixa: { topoMinutos: number; alturaMinutos: number };
}) {
  const horario = horarioDoDia(inicio, fim);
  const texto = [visao === "semana" ? dentista : null, horario, motivo].filter(Boolean).join(" · ");
  return (
    <div
      className="agenda-bloqueio absolute right-1 left-1 z-10 flex flex-col justify-center overflow-hidden rounded-paper-sm border border-l-4 border-tinta px-2 py-1 text-xs leading-4 text-tinta"
      style={{
        top: faixa.topoMinutos + 1,
        height: Math.max(faixa.alturaMinutos - 2, 1),
      }}
      aria-label={`Bloqueio, ${texto}`}
    >
      <span className="font-semibold">Bloqueio</span>
      <span className="truncate">{texto}</span>
    </div>
  );
}

function rotuloDoDia(dia: string) {
  const [ano, mes, diaNum] = dia.split("-").map(Number);
  const data = new Date(ano, mes - 1, diaNum);
  const semana = data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return {
    nome: semana.charAt(0).toUpperCase() + semana.slice(1),
    sub: `${String(diaNum).padStart(2, "0")}/${String(mes).padStart(2, "0")}`,
  };
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const letras = partes.length === 1 ? partes[0].slice(0, 2) : `${partes[0][0]}${partes[partes.length - 1][0]}`;
  return letras.toUpperCase();
}
