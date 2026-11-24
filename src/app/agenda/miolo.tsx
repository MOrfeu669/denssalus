"use client";

import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent, RefObject } from "react";
import { cn } from "@/lib/utils";
import type { AgendamentoNaGrade, BloqueioAgenda } from "../../domain/agendamento/tipos";
import { ALMOCO, CORES_DENTISTA, trilhosNaColuna } from "./apresentacao";
import { Bloqueio, Cartao } from "./cartao";
import { CabecalhoDia, CabecalhoSemana, Hora, rotuloHora } from "./celulas";
import { foraDoExpediente } from "./horas";
import type { FaixaCartao, VisaoGrade } from "./posicao";

type Nomes = {
  pacientes: Record<string, string>;
  dentistas: Record<string, string>;
  cadeiras: Record<string, string>;
  procedimentos: Record<string, string>;
};

export type ColunaVisivel = {
  id: string;
  nome: string;
  subtitulo: string;
  cadeiraId: string;
};

export type PostoVisivel =
  | { tipo: "agendamento"; item: AgendamentoNaGrade; faixa: FaixaCartao }
  | { tipo: "bloqueio"; item: BloqueioAgenda; faixa: FaixaCartao };

type Preview = { id: string; coluna: number; topo: number; altura: number };

export function Miolo({
  visao,
  data,
  hoje,
  horas,
  primeiraHora,
  pxHora,
  colunas,
  contagem,
  ordemDentistas,
  dentistas,
  postos,
  preview,
  nomes,
  mostraAlmoco,
  abertura,
  fechamento,
  agoraMinutos,
  relogio,
  gradeRef,
  arrastando,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClickCapture,
  onComecar,
  consumirClique,
  hrefDoItem,
}: {
  visao: VisaoGrade;
  data: string;
  hoje: string;
  horas: number[];
  primeiraHora: number;
  pxHora: number;
  colunas: ColunaVisivel[];
  contagem: Record<string, number>;
  ordemDentistas: string[];
  dentistas: { id: string; nome: string }[];
  postos: PostoVisivel[];
  preview: Preview | null;
  nomes: Nomes;
  mostraAlmoco: boolean;
  abertura: string;
  fechamento: string;
  agoraMinutos: number | null;
  relogio: string;
  gradeRef: RefObject<HTMLDivElement | null>;
  arrastando: boolean;
  onPointerDown: (evento: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (evento: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onClickCapture: (evento: ReactMouseEvent<HTMLDivElement>) => void;
  onComecar: (evento: ReactPointerEvent<HTMLElement>, modo: "mover" | "alongar", item: AgendamentoNaGrade, faixa: FaixaCartao, coluna: number) => void;
  consumirClique: () => boolean;
  hrefDoItem: (id: string) => string;
}) {
  const escala = pxHora / 60;
  const altura = horas.length * pxHora;
  const agoraPx = agoraMinutos === null ? null : agoraMinutos * escala;
  const almocoTop = (ALMOCO.inicio - primeiraHora * 60) * escala;
  const minimo = visao === "semana" ? "7.5rem" : "14rem";

  function postosDaColuna(indice: number) {
    const daColuna = postos.flatMap((posto) => {
      const faixa =
        posto.tipo === "agendamento" && preview?.id === posto.item.id
          ? { coluna: preview.coluna, topoMinutos: preview.topo, alturaMinutos: preview.altura }
          : posto.faixa;
      return faixa.coluna === indice ? [{ posto, faixa }] : [];
    });
    const trilhos = trilhosNaColuna(
      daColuna
        .filter((item) => item.posto.tipo === "agendamento")
        .map((item) => ({
          id: item.posto.item.id,
          inicio: item.faixa.topoMinutos,
          fim: item.faixa.topoMinutos + item.faixa.alturaMinutos,
        })),
    );
    return daColuna.map(({ posto, faixa }) => {
      const topo = faixa.topoMinutos * escala;
      const alturaFaixa = faixa.alturaMinutos * escala;
      if (posto.tipo === "bloqueio") {
        return (
          <Bloqueio
            key={posto.item.id}
            inicio={posto.item.inicio}
            fim={posto.item.fim}
            motivo={posto.item.motivo}
            dentista={nomes.dentistas[posto.item.dentistaId] ?? posto.item.dentistaId}
            visao={visao}
            topo={topo}
            altura={alturaFaixa}
          />
        );
      }
      const indiceTrilho = trilhos.faixa.get(posto.item.id) ?? 0;
      return (
        <Cartao
          key={posto.item.id}
          item={posto.item}
          topo={topo}
          altura={alturaFaixa}
          visao={visao}
          nomes={nomes}
          href={hrefDoItem(posto.item.id)}
          corIndice={Math.max(ordemDentistas.indexOf(posto.item.dentistaId), 0)}
          trilho={visao === "semana" ? { indice: indiceTrilho, total: trilhos.total } : undefined}
          podeMover={posto.item.status === "agendado"}
          arrastando={preview?.id === posto.item.id}
          onComecar={(evento, modo) => onComecar(evento, modo, posto.item, posto.faixa, indice)}
          consumirClique={consumirClique}
        />
      );
    });
  }

  return (
    <div
      ref={gradeRef}
      className={cn(
        "cursor-grab overflow-x-auto rounded-paper-md border border-borda-papel bg-card shadow-paper-sm touch-pan-y",
        arrastando && "cursor-grabbing [&_*]:cursor-grabbing",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <div
        className="grid min-w-full"
        style={{ gridTemplateColumns: `4rem repeat(${Math.max(colunas.length, 1)}, minmax(${minimo}, 1fr))` }}
      >
        <div className="border-b border-borda-papel" />
        {colunas.map((coluna, indice) =>
          visao === "semana" ? (
            <CabecalhoSemana key={coluna.id} id={coluna.id} hoje={hoje} consultas={contagem[coluna.id] ?? 0} />
          ) : (
            <CabecalhoDia key={coluna.id} nome={coluna.nome} subtitulo={coluna.subtitulo} indice={indice} />
          ),
        )}
        <div className="relative" style={{ height: altura }}>
          {horas.map((hora, indice) => (
            <span
              key={hora}
              className="absolute right-2 font-mono text-xs leading-4 text-paper-ink-3 tabular-nums"
              style={{ top: indice * pxHora - 8 }}
            >
              {rotuloHora(hora)}
            </span>
          ))}
          {visao === "dia" && agoraPx !== null ? (
            <span className="pointer-events-none absolute right-0 left-1.5 z-20" style={{ top: agoraPx }}>
              <span className="sr-only">Agora, {relogio}</span>
              <span className="grid h-5 w-[46px] -translate-y-1/2 place-items-center rounded-full bg-perigo text-[12px] font-semibold text-white tabular-nums">
                {relogio}
              </span>
              <span className="absolute top-0 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-perigo" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        {colunas.map((coluna, indice) => {
          const hojeColuna = visao === "semana" && coluna.id === hoje;
          return (
            <div
              key={coluna.id}
              data-coluna={indice}
              className={cn("relative border-l border-borda-papel", hojeColuna && "bg-[#FAF8FF]")}
              style={{ height: altura }}
            >
              {horas.map((hora, indiceHora) => (
                <Hora
                  key={hora}
                  visao={visao}
                  data={visao === "semana" ? coluna.id : data}
                  hora={hora}
                  primeiraHora={primeiraHora}
                  pxHora={pxHora}
                  indice={indiceHora}
                  nome={coluna.nome}
                  dentistaId={visao === "dia" ? coluna.id : ""}
                  cadeiraId={visao === "dia" ? coluna.cadeiraId : ""}
                  fora={foraDoExpediente(hora, abertura, fechamento)}
                />
              ))}
              {mostraAlmoco ? (
                <div
                  className="pointer-events-none absolute right-0 left-0 z-[1] bg-[#F6F6EF]"
                  style={{ top: almocoTop, height: pxHora }}
                >
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[11px] tracking-wide text-[#A3A193] uppercase">
                    Almoço
                  </span>
                </div>
              ) : null}
              {agoraPx !== null && (visao === "dia" || hojeColuna) ? (
                <span className="pointer-events-none absolute right-0 left-0 z-20 h-0.5 bg-perigo" style={{ top: agoraPx }} aria-hidden="true" />
              ) : null}
              {postosDaColuna(indice)}
            </div>
          );
        })}
        {visao === "semana" ? (
          <div className="col-span-full flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-borda-papel px-6 py-3">
            <span className="font-mono text-[11px] tracking-wide text-paper-ink-3 uppercase">Dentistas</span>
            {dentistas.map((dentista, indice) => {
              const cor = CORES_DENTISTA[indice % CORES_DENTISTA.length];
              return (
                <span key={dentista.id} className="inline-flex items-center gap-2 text-[13px] text-paper-ink-2">
                  <span className="size-3 rounded-[3px]" style={{ background: cor.stripe }} aria-hidden="true" />
                  {dentista.nome}
                </span>
              );
            })}
            <span className="ml-auto text-xs leading-5 text-paper-ink-3">
              Arraste para remarcar · clique num horário vazio para agendar
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

