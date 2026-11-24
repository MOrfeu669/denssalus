import { AlertTriangle, Check } from "lucide-react";
import Link from "next/link";
import { BadgeStatus } from "@/components/ui/badge";
import type { Agendamento } from "../../../domain/agendamento/tipos";
import type { Canal } from "../../../domain/paciente/tipos";
import type { AlertaClinico, ItemVisual } from "./ficha-dados";
import { hrefRemarcar, indiceEtapaAtual, moeda, rotuloConsulta } from "./ficha-dados";
import { BotaoLembrete } from "./lembrete";

export function LateralFicha({
  alertas,
  consulta,
  nomes,
  procedimento,
  canal,
  agoraIso,
  pacienteId,
  plano,
  financeiro,
  mostrarPlano,
}: {
  alertas: AlertaClinico[];
  consulta: Agendamento | null;
  nomes: { dentista: string | null; cadeira: string | null };
  procedimento: string | null;
  canal: Canal | null;
  agoraIso: string;
  pacienteId: string;
  plano: { titulo: string; itens: ItemVisual[] } | null;
  financeiro: {
    pago: number;
    emAberto: number;
    totalPlano: number | null;
    aFaturar: number | null;
  };
  mostrarPlano: boolean;
}) {
  const atual = plano ? indiceEtapaAtual(plano.itens, consulta?.id ?? null) : -1;
  const concluidos = plano?.itens.filter((item) => item.status === "concluido").length ?? 0;
  const etapas = plano?.itens.length ?? 0;
  const valorConcluido = plano?.itens.filter((item) => item.status === "concluido").reduce((soma, item) => soma + item.valor, 0) ?? 0;
  const total = plano?.itens.reduce((soma, item) => soma + item.valor, 0) ?? 0;
  const progresso = etapas === 0 ? 0 : Math.round((concluidos / etapas) * 100);

  return (
    <aside className="flex flex-col gap-4" aria-label="Resumo da ficha">
      <section className="rounded-paper-md border border-[#FECACA] bg-perigo-fundo p-5" aria-labelledby="alertas-clinicos">
        <h2 id="alertas-clinicos" className="m-0 flex items-center gap-2 font-heading text-base leading-6 font-semibold text-[#7F1D1D]">
          <AlertTriangle aria-hidden="true" className="size-5 text-perigo" />
          Alertas clínicos
        </h2>
        {alertas.length === 0 ? (
          <p className="mt-3 mb-0 text-sm text-[#991B1B]">Nenhum alerta clínico na anamnese.</p>
        ) : (
          <ul className="mt-3 mb-0 list-none p-0">
            {alertas.map((alerta) => (
              <li key={`${alerta.tipo}-${alerta.titulo}`} className="mt-3 flex gap-3 first:mt-0">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-perigo" />
                <span>
                  <span className="block text-sm font-medium text-[#7F1D1D]">{alerta.titulo}</span>
                  {alerta.orientacao ? (
                    <span className="mt-0.5 block text-[13px] leading-[18px] text-[#991B1B]">{alerta.orientacao}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Consulta
        consulta={consulta}
        nomes={nomes}
        procedimento={procedimento}
        canal={canal}
        agoraIso={agoraIso}
        pacienteId={pacienteId}
      />

      {mostrarPlano ? (
        <section className="rounded-paper-md border border-borda-papel bg-card p-5 shadow-paper-sm" aria-labelledby="plano-resumo">
          <h2 id="plano-resumo" className="m-0 font-heading text-base leading-6 font-semibold text-tinta">
            Plano de tratamento
          </h2>
          {plano && etapas > 0 ? (
            <>
              <p className="mt-1 mb-3 text-[13px] text-paper-ink-3">
                {`${concluidos} de ${etapas} etapas · ${moeda(valorConcluido)} de ${moeda(total)}`}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#EDEDE3]" aria-hidden="true">
                <div className="h-full rounded-full bg-ok" style={{ width: `${progresso}%` }} />
              </div>
              <ol className="mt-4 mb-0 list-none p-0">
                {plano.itens.map((item, indice) => (
                  <li key={`${item.procedimentoNome}-${indice}`} className="mt-3 flex items-start gap-3 first:mt-0">
                    <Etapa estado={item.status === "concluido" ? "feito" : indice === atual ? "agora" : "pendente"} />
                    <span className={`min-w-0 flex-1 text-sm ${indice === atual ? "font-medium text-tinta" : "text-paper-ink-2"}`}>
                      {item.procedimentoNome}
                      {item.dentes.length > 0 ? ` ${item.dentes.join(", ")}` : ""}
                    </span>
                    <span className="shrink-0 text-[13px] text-paper-ink-3 tabular-nums">{moeda(item.valor)}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="mt-3 mb-0 text-sm text-paper-ink-2">Nenhum plano de tratamento.</p>
          )}
        </section>
      ) : null}

      <section className="rounded-paper-md border border-borda-papel bg-card p-5 shadow-paper-sm" aria-labelledby="financeiro-paciente">
        <h2 id="financeiro-paciente" className="m-0 font-heading text-base leading-6 font-semibold text-tinta">
          Financeiro
        </h2>
        <dl className="mt-3 mb-0">
          {financeiro.totalPlano !== null ? <Linha rotulo="Total do plano" valor={moeda(financeiro.totalPlano)} tom="text-tinta" /> : null}
          <Linha rotulo="Pago" valor={moeda(financeiro.pago)} tom="text-ok" />
          <Linha rotulo="Em aberto" valor={moeda(financeiro.emAberto)} tom="text-aviso" />
          {financeiro.aFaturar !== null ? <Linha rotulo="A faturar" valor={moeda(financeiro.aFaturar)} tom="text-paper-ink-2" /> : null}
        </dl>
      </section>
    </aside>
  );
}

function Consulta({
  consulta,
  nomes,
  procedimento,
  canal,
  agoraIso,
  pacienteId,
}: {
  consulta: Agendamento | null;
  nomes: { dentista: string | null; cadeira: string | null };
  procedimento: string | null;
  canal: Canal | null;
  agoraIso: string;
  pacienteId: string;
}) {
  return (
    <section className="rounded-paper-md border border-borda-papel bg-card p-5 shadow-paper-sm" aria-labelledby="proxima-consulta">
      <div className="flex items-center justify-between gap-2">
        <h2 id="proxima-consulta" className="m-0 font-mono text-[11px] tracking-wide text-paper-ink-3 uppercase">
          Próxima consulta
        </h2>
        {consulta ? <BadgeStatus status={consulta.status} /> : null}
      </div>
      {consulta ? (
        <ConsultaMarcada
          consulta={consulta}
          nomes={nomes}
          procedimento={procedimento}
          canal={canal}
          agoraIso={agoraIso}
          pacienteId={pacienteId}
        />
      ) : (
        <p className="mt-3 mb-0 text-sm text-paper-ink-2">Nenhuma consulta agendada.</p>
      )}
    </section>
  );
}

function ConsultaMarcada({
  consulta,
  nomes,
  procedimento,
  canal,
  agoraIso,
  pacienteId,
}: {
  consulta: Agendamento;
  nomes: { dentista: string | null; cadeira: string | null };
  procedimento: string | null;
  canal: Canal | null;
  agoraIso: string;
  pacienteId: string;
}) {
  const rotulo = rotuloConsulta(consulta.inicio, consulta.fim);
  const detalhe = [nomes.dentista ?? "Dentista indisponível", nomes.cadeira ? `Cadeira ${nomes.cadeira}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <div className="mt-3 flex gap-3">
        <div className="grid h-[60px] w-14 place-items-center rounded-paper-md border border-borda-papel bg-paper-subtle text-center">
          <span className="font-mono text-[11px] text-paper-ink-3 uppercase">{rotulo?.semana}</span>
          <span className="font-heading text-2xl leading-7 font-bold text-tinta">{rotulo?.dia}</span>
        </div>
        <div className="min-w-0">
          <p className="m-0 text-base leading-6 font-semibold text-tinta tabular-nums">{rotulo?.horario}</p>
          <p className="mt-0.5 mb-0 text-[13px] text-paper-ink-2">{procedimento ?? "Consulta"}</p>
          <p className="mt-0.5 mb-0 text-[13px] text-paper-ink-3">{detalhe}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={hrefRemarcar(pacienteId, consulta.inicio)}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-paper-sm border border-borda-papel bg-card px-2 text-[13px] font-medium text-tinta no-underline hover:bg-papel"
        >
          Remarcar
        </Link>
        <BotaoLembrete inicio={consulta.inicio} canal={canal} agoraIso={agoraIso} />
      </div>
    </>
  );
}

function Etapa({ estado }: { estado: "feito" | "agora" | "pendente" }) {
  if (estado === "feito") {
    return (
      <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-ok text-white" aria-hidden="true">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }
  if (estado === "agora") {
    return (
      <span className="grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-destaque bg-card" aria-hidden="true">
        <span className="size-2 rounded-full bg-destaque" />
      </span>
    );
  }
  return <span className="size-[18px] shrink-0 rounded-full border border-[#C9C8BA] bg-card" aria-hidden="true" />;
}

function Linha({ rotulo, valor, tom }: { rotulo: string; valor: string; tom: string }) {
  return (
    <div className="mt-2 flex items-baseline justify-between gap-3 first:mt-0">
      <dt className="text-sm text-paper-ink-2">{rotulo}</dt>
      <dd className={`m-0 text-sm font-semibold tabular-nums ${tom}`}>{valor}</dd>
    </div>
  );
}
