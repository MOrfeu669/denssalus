import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import type { AgendamentoNaGrade, StatusAgendamento } from "../../domain/agendamento/tipos";
import { horarioDoDia } from "../agendamentos/texto";
import type { VisaoGrade } from "./posicao";
import { rotuloStatus } from "./rotulo";

type Nomes = {
  pacientes: Record<string, string>;
  dentistas: Record<string, string>;
  cadeiras: Record<string, string>;
};

const CORES: Record<StatusAgendamento, { cartao: string; selo: string }> = {
  agendado: { cartao: "border-acao bg-nevoa", selo: "bg-white text-marca" },
  em_espera: { cartao: "border-[#c4841d] bg-[#fff6e8]", selo: "bg-white text-[#8a5a10]" },
  iniciado: { cartao: "border-marca bg-[#e7f6f3]", selo: "bg-acao text-white" },
  concluido: { cartao: "border-ok bg-ok-fundo", selo: "bg-ok-fundo text-ok-tinta" },
  cancelado: { cartao: "border-linha bg-fundo", selo: "bg-white text-apagado" },
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
      <div className="flex items-center gap-2 border-b border-linha px-3 py-2">
        <div>
          <p className="m-0 text-sm leading-4 font-semibold text-tinta">{rotulo.nome}</p>
          <p className="m-0 text-xs leading-4 text-apagado">{rotulo.sub}</p>
        </div>
        {id === hoje ? (
          <span className="rounded-full bg-nevoa px-2 text-[11px] leading-5 font-semibold text-marca">Hoje</span>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 border-b border-linha px-3 py-3">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full bg-nevoa text-[11px] font-bold text-marca"
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
  const visual = item.alerta
    ? { cartao: "border-[#b26a00] bg-[#fff4e0]", selo: "bg-white text-[#8a5a10]" }
    : CORES[item.status];
  const detalhe = visao === "dia" ? `${horario} · ${cadeira}` : `${horario} · ${dentista} · ${cadeira}`;
  return (
    <Link
      href={href}
      className={cn(
        "absolute right-1 left-1 z-10 flex flex-col gap-0.5 overflow-hidden rounded-[10px] border border-l-4 px-2 py-1 text-xs leading-4 text-tinta no-underline",
        visual.cartao,
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
        <span className={cn("shrink-0 rounded-full px-2 text-[11px] leading-4 font-semibold", visual.selo)}>
          {rotuloStatus(item.status)}
        </span>
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
      className="absolute right-1 left-1 z-10 flex flex-col justify-center overflow-hidden rounded-[10px] border border-l-4 border-tinta px-2 py-1 text-xs leading-4 text-tinta"
      style={{
        top: faixa.topoMinutos + 1,
        height: Math.max(faixa.alturaMinutos - 2, 1),
        backgroundImage: "repeating-linear-gradient(-45deg, #e8eef0, #e8eef0 6px, #d5dee3 6px, #d5dee3 8px)",
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
