"use client";

import { Button } from "@/components/ui/button";
import type { Papel } from "../../domain/auth/tipos";
import type { StatusAgendamento } from "../../domain/agendamento/tipos";
import { pedirOverlay, type DestinoOverlay } from "../agendamentos/pedido";
import { TEXTO_GRADE_ATUALIZA } from "../agendamentos/texto";
import { rotuloStatus } from "./rotulo";
import type { VisaoGrade } from "./posicao";

type Opcao = { id: string; rotulo: string };

const PONTOS: Record<StatusAgendamento, string> = {
  agendado: "bg-acao",
  em_espera: "bg-[#c4841d]",
  iniciado: "bg-marca",
  concluido: "bg-ok",
  cancelado: "bg-apagado",
};

const contorno =
  "h-10 cursor-pointer rounded-[10px]! border! border-linha! bg-white! px-3.5! text-sm font-semibold! text-tinta! shadow-none hover:bg-fundo!";
const cheio =
  "h-10 cursor-pointer rounded-[10px]! border-0! bg-acao! px-3.5! text-sm font-semibold! text-white! shadow-none hover:bg-marca!";
const nav =
  "size-10! h-10! w-10! cursor-pointer rounded-[10px]! border! border-linha! bg-white! p-0! text-tinta! shadow-none hover:bg-fundo!";

export function BarraAgenda({
  data,
  visao,
  dentistaId,
  cadeiraId,
  dentistas,
  cadeiras,
  papel,
  onVisao,
  onFiltrar,
}: {
  data: string;
  visao: VisaoGrade;
  dentistaId: string | null;
  cadeiraId: string | null;
  dentistas: Opcao[];
  cadeiras: Opcao[];
  papel: Papel;
  onVisao: (visao: VisaoGrade) => void;
  onFiltrar: (dentista: string, cadeira: string, data?: string) => void;
}) {
  const podeBloquear = papel === "admin" || papel === "dentista";
  const filtrado = Boolean(dentistaId || cadeiraId);

  function abrir(destino: DestinoOverlay, origem: HTMLElement) {
    pedirOverlay({ destino, origem });
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button type="button" variant="outline" className={contorno} onClick={() => onFiltrar(dentistaId ?? "", cadeiraId ?? "", hojeLocal())}>
          Hoje
        </Button>
        <Button
          type="button"
          variant="outline"
          className={nav}
          aria-label="Dia anterior"
          onClick={() => onFiltrar(dentistaId ?? "", cadeiraId ?? "", deslocarDia(data, -1))}
        >
          <IconeSeta sentido="anterior" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className={nav}
          aria-label="Dia seguinte"
          onClick={() => onFiltrar(dentistaId ?? "", cadeiraId ?? "", deslocarDia(data, 1))}
        >
          <IconeSeta sentido="seguinte" />
        </Button>
        <p className="m-0 text-lg leading-6 font-bold text-tinta">{dataPorExtenso(data)}</p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Visualização" className="inline-flex h-10 items-center rounded-[10px] border border-linha bg-white p-1">
            <BotaoVisao ativo={visao === "dia"} onClick={() => onVisao("dia")}>
              Dia
            </BotaoVisao>
            <BotaoVisao ativo={visao === "semana"} onClick={() => onVisao("semana")}>
              Semana
            </BotaoVisao>
          </div>
          {podeBloquear ? (
            <Button
              type="button"
              variant="outline"
              className={contorno}
              onClick={(evento) => abrir("bloquear", evento.currentTarget)}
            >
              Bloquear
            </Button>
          ) : null}
          <Button
            type="button"
            className={cheio}
            onClick={(evento) => abrir("novo", evento.currentTarget)}
          >
            Novo agendamento
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chips
          rotulo="Dentistas"
          opcoes={dentistas}
          ativo={dentistaId}
          onEscolher={(id) => onFiltrar(id, cadeiraId ?? "")}
        />
        <Chips
          rotulo="Cadeiras"
          opcoes={cadeiras}
          ativo={cadeiraId}
          onEscolher={(id) => onFiltrar(dentistaId ?? "", id)}
        />
        {filtrado ? (
          <Button
            type="button"
            variant="ghost"
            className="h-8 cursor-pointer border-0! bg-transparent! px-2! text-[13px] font-semibold! text-link! shadow-none hover:bg-transparent!"
            onClick={() => onFiltrar("", "")}
          >
            Limpar filtros
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {(Object.keys(PONTOS) as StatusAgendamento[]).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-xs leading-4 text-apagado">
            <span className={`size-2 rounded-full ${PONTOS[status]}`} aria-hidden="true" />
            {rotuloStatus(status)}
          </span>
        ))}
        <p className="m-0 ml-auto flex items-center gap-2 text-xs leading-4 text-apagado">
          <span className="relative grid size-3.5 place-items-center" aria-hidden="true">
            <span className="absolute size-3.5 rounded-full border border-ok" />
            <span className="size-2 rounded-full bg-ok" />
          </span>
          {TEXTO_GRADE_ATUALIZA}
        </p>
      </div>
    </div>
  );
}

function Chips({
  rotulo,
  opcoes,
  ativo,
  onEscolher,
}: {
  rotulo: string;
  opcoes: Opcao[];
  ativo: string | null;
  onEscolher: (id: string) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] leading-4 font-semibold text-apagado">{rotulo}</span>
      {opcoes.map((opcao) => {
        const ligado = ativo === opcao.id;
        return (
          <Button
            key={opcao.id}
            type="button"
            variant="outline"
            aria-pressed={ligado}
            className={
              ligado
                ? "h-8 cursor-pointer rounded-full! border! border-acao! bg-acao! px-3! text-[13px] font-semibold! text-white! shadow-none"
                : "h-8 cursor-pointer rounded-full! border! border-linha! bg-white! px-3! text-[13px] font-semibold! text-tinta! shadow-none hover:bg-fundo!"
            }
            onClick={() => onEscolher(ligado ? "" : opcao.id)}
          >
            {opcao.rotulo}
          </Button>
        );
      })}
    </div>
  );
}

function BotaoVisao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={ativo}
      className={
        ativo
          ? "h-8 cursor-pointer rounded-lg! border-0! bg-acao! px-4! text-sm font-semibold! text-white! shadow-none hover:bg-acao!"
          : "h-8 cursor-pointer rounded-lg! border-0! bg-transparent! px-4! text-sm font-semibold! text-marca! shadow-none hover:bg-nevoa!"
      }
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function IconeSeta({ sentido }: { sentido: "anterior" | "seguinte" }) {
  const caminho = sentido === "anterior" ? "M11 4 L6 9 L11 14" : "M7 4 L12 9 L7 14";
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d={caminho} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function hojeLocal() {
  const agora = new Date();
  return deslocarDia(`${agora.getFullYear()}-${par(agora.getMonth() + 1)}-${par(agora.getDate())}`, 0);
}

function deslocarDia(data: string, dias: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const alvo = new Date(ano, mes - 1, dia + dias);
  return `${alvo.getFullYear()}-${par(alvo.getMonth() + 1)}-${par(alvo.getDate())}`;
}

function dataPorExtenso(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const texto = new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function par(n: number) {
  return String(n).padStart(2, "0");
}
