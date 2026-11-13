"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils";
import type { Papel } from "../../domain/auth/tipos";
import type { AgendamentoNaGrade, BloqueioAgenda, Grade as GradeAgenda } from "../../domain/agendamento/tipos";
import { vazioDaGrade } from "../agendamentos/texto";
import { pedirOverlay } from "../agendamentos/pedido";
import { BarraAgenda } from "./barra";
import { Bloqueio, Cabecalho, Cartao } from "./cartao";
import { ALTURA_HORA, diaDeHoje, foraDoExpediente, horasDaGrade, minutosDeAgora } from "./horas";
import { posicaoDoCartao, type FaixaCartao, type VisaoGrade } from "./posicao";
import { intervaloDaHora } from "./slot";
import { useArrasteGrade } from "./use-arraste";

type Nomes = {
  pacientes: Record<string, string>;
  dentistas: Record<string, string>;
  cadeiras: Record<string, string>;
};

type Props = {
  grade: GradeAgenda;
  data: string;
  dentistaId: string | null;
  cadeiraId: string | null;
  nomes: Nomes;
  papel: Papel;
  opcoes: {
    dentistas: { id: string; nome: string }[];
    cadeiras: { id: string; identificacao: string }[];
  };
};

type Posto =
  | { tipo: "agendamento"; item: AgendamentoNaGrade; faixa: FaixaCartao }
  | { tipo: "bloqueio"; item: BloqueioAgenda; faixa: FaixaCartao };

const diaDe = (iso: string) => iso.slice(0, 10);
const rotuloHora = (hora: number) => `${String(hora).padStart(2, "0")}:00`;

export function Grade({ grade, data, dentistaId, cadeiraId, nomes, papel, opcoes }: Props) {
  const router = useRouter();
  const [visao, setVisao] = useState<VisaoGrade>("dia");
  const nome = (mapa: Record<string, string>, id: string) => mapa[id] ?? id;

  const agendamentos =
    visao === "dia" ? grade.agendamentos.filter((item) => diaDe(item.inicio) === data) : grade.agendamentos;
  const bloqueios =
    visao === "dia" ? grade.bloqueios.filter((item) => diaDe(item.inicio) === data) : grade.bloqueios;
  const colunas =
    visao === "dia"
      ? colunasDoDia(dentistaId, opcoes.dentistas, [...agendamentos, ...bloqueios], nomes.dentistas)
      : grade.dias.map((dia) => ({ id: dia, nome: dia }));
  const chaves = colunas.map((coluna) => coluna.id);
  const horas = horasDaGrade(grade.horarioAbertura, grade.horarioFechamento, [...agendamentos, ...bloqueios]);
  const primeiraHora = horas[0] ?? 0;
  const postos = posicionar(visao, agendamentos, bloqueios, chaves, primeiraHora);
  const arraste = useArrasteGrade({
    visao,
    data,
    chaves,
    primeiraHora,
    alturaGrade: horas.length * ALTURA_HORA,
    aoConcluir: () => router.refresh(),
  });
  const vazio = agendamentos.length === 0 && bloqueios.length === 0;
  const agora = minutosDeAgora(visao, data, grade.dias, horas);
  const hoje = diaDeHoje();
  const rolagem = useRolagemHorizontal();

  function filtrar(proximoDentista: string, proximaCadeira: string, proximaData = data) {
    const query = new URLSearchParams({ data: proximaData });
    if (proximoDentista) query.set("dentista", proximoDentista);
    if (proximaCadeira) query.set("cadeira", proximaCadeira);
    router.push(`/agenda?${query.toString()}`, { scroll: false });
  }

  function hrefDoItem(id: string) {
    const query = new URLSearchParams({ data });
    if (dentistaId) query.set("dentista", dentistaId);
    if (cadeiraId) query.set("cadeira", cadeiraId);
    return `/agenda?${query.toString()}#${id}`;
  }

  return (
    <section aria-label="Agenda" className="flex flex-col gap-3.5">
      <BarraAgenda
        data={data}
        visao={visao}
        dentistaId={dentistaId}
        cadeiraId={cadeiraId}
        dentistas={opcoes.dentistas.map((item) => ({ id: item.id, rotulo: item.nome }))}
        cadeiras={opcoes.cadeiras.map((item) => ({ id: item.id, rotulo: item.identificacao }))}
        papel={papel}
        onVisao={setVisao}
        onFiltrar={filtrar}
      />

      {arraste.erro ? (
        <p ref={arraste.erroRef} tabIndex={-1} role="alert" className="m-0 rounded-[14px] border border-perigo bg-perigo-fundo px-4 py-3 text-sm font-semibold text-perigo-tinta">
          {arraste.erro}
        </p>
      ) : null}
      {vazio ? (
        <p className="m-0 rounded-[14px] border border-linha bg-white px-6 py-6 text-base leading-6 text-apagado">
          {vazioDaGrade(visao)}
        </p>
      ) : null}
      {horas.length > 0 ? (
        <div
          ref={arraste.gradeRef}
          className={cn(
            "cursor-grab overflow-x-auto rounded-[14px] border border-linha bg-white touch-pan-y",
            rolagem.arrastando && "cursor-grabbing [&_*]:cursor-grabbing",
          )}
          onPointerDown={rolagem.pointerDown}
          onPointerMove={rolagem.pointerMove}
          onPointerUp={rolagem.pointerUp}
          onPointerCancel={rolagem.pointerUp}
          onClickCapture={rolagem.clique}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `4rem repeat(${Math.max(chaves.length, 1)}, minmax(${visao === "semana" ? "8.5rem" : "14rem"}, 1fr))`,
            }}
          >
            <div className="border-b border-linha bg-white" />
            {colunas.map((coluna) => (
              <Cabecalho key={coluna.id} visao={visao} id={coluna.id} nome={coluna.nome} hoje={hoje} />
            ))}
            <div className="relative" style={{ height: horas.length * ALTURA_HORA }}>
              {horas.map((hora, indice) => (
                <span
                  key={hora}
                  className="absolute left-2 text-xs leading-4 font-semibold text-apagado"
                  style={{ top: indice * ALTURA_HORA + 6 }}
                >
                  {rotuloHora(hora)}
                </span>
              ))}
            </div>
            {colunas.map((coluna, indice) => (
              <div
                key={coluna.id}
                data-coluna={indice}
                className="relative border-l border-linha"
                style={{ height: horas.length * ALTURA_HORA }}
              >
                {horas.map((hora, indice) => {
                  const dia = visao === "semana" ? coluna.id : data;
                  const intervalo = intervaloDaHora(dia, hora);
                  return (
                    <button
                      key={hora}
                      type="button"
                      className={cn(
                        "absolute left-0! z-0 w-full! cursor-pointer border-x-0! border-b-0! border-t! border-linha! bg-transparent! p-0! shadow-none hover:bg-nevoa/70!",
                        foraDoExpediente(hora, grade.horarioAbertura, grade.horarioFechamento) && "bg-fundo!",
                      )}
                      style={{ top: indice * ALTURA_HORA, height: ALTURA_HORA }}
                      aria-label={
                        visao === "dia"
                          ? `Novo agendamento com ${coluna.nome} em ${dia.slice(8, 10)}/${dia.slice(5, 7)} às ${rotuloHora(hora)}`
                          : `Novo agendamento em ${dia.slice(8, 10)}/${dia.slice(5, 7)} às ${rotuloHora(hora)}`
                      }
                      onClick={(evento) => {
                        if (!intervalo) return;
                        pedirOverlay({
                          destino: "novo",
                          origem: evento.currentTarget,
                          slot: {
                            inicio: intervalo.inicio,
                            fim: intervalo.fim,
                            dentistaId: visao === "dia" ? coluna.id : dentistaId ?? "",
                            cadeiraId: cadeiraId ?? "",
                          },
                        });
                      }}
                    />
                  );
                })}
                {agora !== null && (visao === "dia" || coluna.id === hoje) ? (
                  <div className="pointer-events-none absolute right-0 left-0 z-20 h-0.5 bg-perigo" style={{ top: agora }} aria-hidden="true" />
                ) : null}
                {postos
                  .map((posto) => {
                    const faixa =
                      arraste.preview?.id === posto.item.id
                        ? {
                            coluna: arraste.preview.coluna,
                            topoMinutos: arraste.preview.topo,
                            alturaMinutos: arraste.preview.altura,
                          }
                        : posto.faixa;
                    return { ...posto, faixa };
                  })
                  .filter((posto) => chaves[posto.faixa.coluna] === coluna.id)
                  .map((posto) =>
                    posto.tipo === "agendamento" ? (
                      <Cartao
                        key={posto.item.id}
                        item={posto.item}
                        faixa={posto.faixa}
                        visao={visao}
                        nomes={nomes}
                        href={hrefDoItem(posto.item.id)}
                        podeMover={posto.item.status === "agendado"}
                        arrastando={arraste.ativo && arraste.preview?.id === posto.item.id}
                        onComecar={(evento, modo) => arraste.comecar(evento, modo, posto.item, posto.faixa, indice)}
                        consumirClique={arraste.consumirClique}
                      />
                    ) : (
                      <Bloqueio
                        key={posto.item.id}
                        inicio={posto.item.inicio}
                        fim={posto.item.fim}
                        motivo={posto.item.motivo}
                        dentista={nome(nomes.dentistas, posto.item.dentistaId)}
                        visao={visao}
                        faixa={posto.faixa}
                      />
                    ),
                  )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function posicionar(
  visao: VisaoGrade,
  agendamentos: AgendamentoNaGrade[],
  bloqueios: BloqueioAgenda[],
  chaves: string[],
  primeiraHora: number,
): Posto[] {
  const postos: Posto[] = [];
  for (const item of bloqueios) {
    const faixa = posicaoDoCartao(visao, item, chaves, primeiraHora);
    if (faixa) postos.push({ tipo: "bloqueio", item, faixa });
  }
  for (const item of agendamentos) {
    const faixa = posicaoDoCartao(visao, item, chaves, primeiraHora);
    if (faixa) postos.push({ tipo: "agendamento", item, faixa });
  }
  return postos;
}

function colunasDoDia(
  dentistaId: string | null,
  dentistas: { id: string; nome: string }[],
  itens: { dentistaId: string }[],
  nomes: Record<string, string>,
) {
  const base = dentistaId ? dentistas.filter((item) => item.id === dentistaId) : dentistas;
  const ids = new Set(base.map((item) => item.id));
  const extras: { id: string; nome: string }[] = [];
  for (const item of itens) {
    if (ids.has(item.dentistaId)) continue;
    if (dentistaId && item.dentistaId !== dentistaId) continue;
    ids.add(item.dentistaId);
    extras.push({ id: item.dentistaId, nome: nomes[item.dentistaId] ?? item.dentistaId });
  }
  return [...base.map((item) => ({ id: item.id, nome: item.nome })), ...extras];
}

const LIMIAR_ROLAGEM = 4;

export function scrollDoArraste(inicio: number, origemX: number, x: number) {
  return inicio - (x - origemX);
}

function useRolagemHorizontal() {
  const origem = useRef<{ x: number; scroll: number; id: number; el: HTMLDivElement } | null>(null);
  const moveu = useRef(false);
  const [arrastando, setArrastando] = useState(false);

  function pointerDown(evento: ReactPointerEvent<HTMLDivElement>) {
    if (evento.button !== 0) return;
    const alvo = evento.target as HTMLElement;
    if (alvo.closest("a, [data-alca]")) return;
    origem.current = {
      x: evento.clientX,
      scroll: evento.currentTarget.scrollLeft,
      id: evento.pointerId,
      el: evento.currentTarget,
    };
    moveu.current = false;
  }

  function pointerMove(evento: ReactPointerEvent<HTMLDivElement>) {
    const gesto = origem.current;
    if (!gesto) return;
    const dx = evento.clientX - gesto.x;
    if (Math.abs(dx) < LIMIAR_ROLAGEM) return;
    if (!moveu.current) {
      moveu.current = true;
      gesto.el.setPointerCapture(gesto.id);
      setArrastando(true);
    }
    gesto.el.scrollLeft = scrollDoArraste(gesto.scroll, gesto.x, evento.clientX);
  }

  function pointerUp() {
    origem.current = null;
    setArrastando(false);
  }

  function clique(evento: ReactMouseEvent<HTMLDivElement>) {
    if (!moveu.current) return;
    evento.preventDefault();
    evento.stopPropagation();
    moveu.current = false;
  }

  return { arrastando, pointerDown, pointerMove, pointerUp, clique };
}
