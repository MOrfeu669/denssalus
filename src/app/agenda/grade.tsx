"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgendamentoNaGrade, BloqueioAgenda, Grade as GradeAgenda } from "../../domain/agendamento/tipos";
import { pedirOverlay } from "../agendamentos/pedido";
import { vazioDaGrade } from "../agendamentos/texto";
import {
  almocoVisivel,
  colunasDoDia,
  contarDia,
  minutosEntre,
  percentualOcupacao,
  pixelsPorMinuto,
  PX_HORA,
  resumoDia,
  resumoSemana,
  semanaIso,
} from "./apresentacao";
import { BarraAgenda } from "./barra";
import { diaDeHoje, horasDaGrade, minutosDeAgora } from "./horas";
import { LateralDia } from "./lateral";
import { Miolo, type ColunaVisivel, type PostoVisivel } from "./miolo";
import { posicaoDoCartao, type VisaoGrade } from "./posicao";
import { useRolagemHorizontal } from "./rolagem";
import { useArrasteGrade } from "./use-arraste";

export { scrollDoArraste } from "./rolagem";

type Nomes = {
  pacientes: Record<string, string>;
  dentistas: Record<string, string>;
  cadeiras: Record<string, string>;
  procedimentos: Record<string, string>;
};

type Props = {
  grade: GradeAgenda;
  data: string;
  visaoInicial: VisaoGrade;
  dentistaId: string | null;
  cadeiraId: string | null;
  nomes: Nomes;
  opcoes: {
    dentistas: { id: string; nome: string }[];
    cadeiras: { id: string; identificacao: string }[];
  };
};

const diaDe = (iso: string) => iso.slice(0, 10);

export function Grade({ grade, data, visaoInicial, dentistaId, cadeiraId, nomes, opcoes }: Props) {
  const router = useRouter();
  const [visao, setVisao] = useState<VisaoGrade>(visaoInicial);
  useEffect(() => {
    setVisao(visaoInicial);
  }, [visaoInicial]);

  const doDia = <T extends { inicio: string }>(itens: T[]) =>
    visao === "dia" ? itens.filter((item) => diaDe(item.inicio) === data) : itens;
  const agendamentos = doDia(grade.agendamentos);
  const bloqueios = doDia(grade.bloqueios);
  const colunas = colunasDaVisao(visao, grade.dias, dentistaId, cadeiraId, opcoes, agendamentos, bloqueios, nomes);
  const chaves = colunas.map((coluna) => coluna.id);
  const horas = horasDaGrade(grade.horarioAbertura, grade.horarioFechamento, [...agendamentos, ...bloqueios]);
  const primeiraHora = horas[0] ?? 0;
  const postos = posicionar(visao, agendamentos, bloqueios, chaves, primeiraHora);
  const pxHora = PX_HORA[visao];
  const arraste = useArrasteGrade({
    visao,
    data,
    chaves,
    primeiraHora,
    alturaGrade: horas.length * 60,
    pxPorMinuto: pixelsPorMinuto(visao),
    aoConcluir: () => router.refresh(),
  });
  const vazio = agendamentos.length === 0 && bloqueios.length === 0;
  const agora = minutosDeAgora(visao, data, grade.dias, horas);
  const hoje = diaDeHoje();
  const rolagem = useRolagemHorizontal();
  const contagem = Object.fromEntries(
    grade.dias.map((dia) => [
      dia,
      grade.agendamentos.filter((item) => diaDe(item.inicio) === dia && item.status !== "cancelado").length,
    ]),
  );
  const resumo = textoResumo(visao, data, grade, agendamentos, dentistaId ? 1 : opcoes.dentistas.length);
  const espera = grade.agendamentos
    .filter((item) => diaDe(item.inicio) === data && item.status === "em_espera")
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const ocupados = new Set(
    grade.agendamentos.filter((item) => item.status !== "cancelado").map((item) => diaDe(item.inicio)),
  );

  function filtrar(proximoDentista: string, proximaCadeira: string, proximaData = data, proximaVisao = visao) {
    const query = new URLSearchParams({ data: proximaData });
    if (proximoDentista) query.set("dentista", proximoDentista);
    if (proximaCadeira) query.set("cadeira", proximaCadeira);
    if (proximaVisao === "semana") query.set("visao", "semana");
    const destino = `/agenda?${query.toString()}`;
    if (proximaVisao !== visao && proximaData === data) router.replace(destino, { scroll: false });
    else router.push(destino, { scroll: false });
  }

  function hrefDoItem(id: string) {
    const query = new URLSearchParams({ data });
    if (dentistaId) query.set("dentista", dentistaId);
    if (cadeiraId) query.set("cadeira", cadeiraId);
    if (visao === "semana") query.set("visao", "semana");
    return `/agenda?${query.toString()}#${id}`;
  }

  return (
    <section aria-label="Agenda" className="agenda-tela flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>Agenda</h1>
          <p className="m-0 text-base leading-6 text-paper-ink-2">{resumo}</p>
        </div>
        <Button
          type="button"
          className="agenda-primario"
          onClick={(evento) => pedirOverlay({ destino: "novo", origem: evento.currentTarget })}
        >
          <Plus className="size-[18px]" aria-hidden="true" />
          Novo agendamento
        </Button>
      </div>
      <BarraAgenda
        data={data}
        visao={visao}
        dentistaId={dentistaId}
        cadeiraId={cadeiraId}
        dentistas={opcoes.dentistas.map((item) => ({ id: item.id, rotulo: item.nome }))}
        cadeiras={opcoes.cadeiras.map((item) => ({ id: item.id, rotulo: item.identificacao }))}
        dias={grade.dias}
        onVisao={(proxima) => {
          setVisao(proxima);
          filtrar(dentistaId ?? "", cadeiraId ?? "", data, proxima);
        }}
        onFiltrar={(dentista, cadeira, proximaData) => filtrar(dentista, cadeira, proximaData)}
      />
      {arraste.erro ? (
        <p
          ref={arraste.erroRef}
          tabIndex={-1}
          role="alert"
          className="m-0 rounded-paper-md border border-perigo bg-perigo-fundo px-4 py-3 text-sm font-semibold text-perigo-tinta outline-none"
        >
          {arraste.erro}
        </p>
      ) : null}
      {vazio ? <p className="m-0 text-base leading-6 text-paper-ink-2">{vazioDaGrade(visao)}</p> : null}
      <div className={cn("flex flex-col gap-6", visao === "dia" && "xl:flex-row xl:items-start")}>
        {horas.length > 0 ? (
          <div className="min-w-0 flex-1">
            <Miolo
              visao={visao}
              data={data}
              hoje={hoje}
              horas={horas}
              primeiraHora={primeiraHora}
              pxHora={pxHora}
              colunas={colunas}
              contagem={contagem}
              ordemDentistas={opcoes.dentistas.map((item) => item.id)}
              dentistas={opcoes.dentistas}
              postos={postos}
              preview={arraste.preview}
              nomes={nomes}
              mostraAlmoco={almocoVisivel(grade.horarioAbertura, grade.horarioFechamento) && horas.includes(12)}
              abertura={grade.horarioAbertura}
              fechamento={grade.horarioFechamento}
              agoraMinutos={agora}
              relogio={relogioAgora()}
              gradeRef={arraste.gradeRef}
              arrastando={rolagem.arrastando}
              onPointerDown={rolagem.pointerDown}
              onPointerMove={rolagem.pointerMove}
              onPointerUp={rolagem.pointerUp}
              onClickCapture={rolagem.clique}
              onComecar={arraste.comecar}
              consumirClique={arraste.consumirClique}
              hrefDoItem={hrefDoItem}
            />
          </div>
        ) : null}
        {visao === "dia" ? (
          <LateralDia
            data={data}
            ocupados={ocupados}
            espera={espera}
            nomes={nomes}
            onEscolher={(iso) => filtrar(dentistaId ?? "", cadeiraId ?? "", iso)}
          />
        ) : null}
      </div>
    </section>
  );
}

function textoResumo(
  visao: VisaoGrade,
  data: string,
  grade: GradeAgenda,
  visiveis: AgendamentoNaGrade[],
  dentistas: number,
) {
  if (visao === "dia") {
    const conta = contarDia(visiveis);
    return resumoDia(conta.consultas, conta.espera);
  }
  const ativos = visiveis.filter((item) => item.status !== "cancelado");
  const semana = semanaIso(data) ?? 0;
  const ocupacao = percentualOcupacao({
    minutosOcupados: ativos.reduce((total, item) => total + minutosEntre(item.inicio, item.fim), 0),
    dentistas,
    abertura: grade.horarioAbertura,
    fechamento: grade.horarioFechamento,
    dias: grade.dias.length,
  });
  return resumoSemana(semana, ativos.length, ocupacao);
}

function colunasDaVisao(
  visao: VisaoGrade,
  dias: string[],
  dentistaId: string | null,
  cadeiraId: string | null,
  opcoes: Props["opcoes"],
  agendamentos: AgendamentoNaGrade[],
  bloqueios: BloqueioAgenda[],
  nomes: Nomes,
): ColunaVisivel[] {
  if (visao === "semana") {
    return dias.map((dia) => ({ id: dia, nome: dia, subtitulo: "", cadeiraId: "" }));
  }
  return colunasDoDia({
    dentistaId,
    dentistas: opcoes.dentistas,
    presentes: [...agendamentos, ...bloqueios],
    agendamentos,
    nomesDentistas: nomes.dentistas,
    nomesCadeiras: nomes.cadeiras,
    cadeiraId,
    nomeCadeiraFiltrada: cadeiraId ? (nomes.cadeiras[cadeiraId] ?? null) : null,
  });
}

function posicionar(
  visao: VisaoGrade,
  agendamentos: AgendamentoNaGrade[],
  bloqueios: BloqueioAgenda[],
  chaves: string[],
  primeiraHora: number,
): PostoVisivel[] {
  const postos: PostoVisivel[] = [];
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

function relogioAgora() {
  const agora = new Date();
  return `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
}
