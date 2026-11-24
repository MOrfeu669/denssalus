"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Calendar, Mail, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Canal } from "../../../domain/paciente/tipos";
import type { AlertaClinico } from "./ficha-dados";

export type AbaFicha = { id: string; rotulo: string; contagem?: number };

function IconeCanal({ canal }: { canal: Canal }) {
  if (canal === "email") return <Mail aria-hidden="true" className="size-4 text-paper-ink-3" />;
  if (canal === "sms") return <Phone aria-hidden="true" className="size-4 text-paper-ink-3" />;
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 text-ok">
      <path
        d="M4 20 5.3 16.3A8.5 8.5 0 1 1 8 19Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Ficha({
  nome,
  iniciaisNome,
  meta,
  responsavel,
  canais,
  alertas,
  debitoRotulo,
  podeEvoluir,
  destinoAgenda,
  abas,
  inicial,
  paineis,
  lateral,
}: {
  nome: string;
  iniciaisNome: string;
  meta: string;
  responsavel: string | null;
  canais: { canal: Canal; contato: string }[];
  alertas: AlertaClinico[];
  debitoRotulo: string | null;
  podeEvoluir: boolean;
  destinoAgenda: string;
  abas: AbaFicha[];
  inicial: string;
  paineis: Record<string, ReactNode>;
  lateral: ReactNode;
}) {
  const [aba, setAba] = useState(inicial);
  const painel = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  function irPara(id: string) {
    setAba(id);
    requestAnimationFrame(() => {
      const evolucao = id === "evolucoes" ? document.getElementById("evolucao-texto") : null;
      (evolucao ?? painel.current)?.focus();
    });
  }

  function noTeclado(evento: KeyboardEvent<HTMLDivElement>) {
    const ordem = abas.map((item) => item.id);
    const atual = ordem.indexOf(aba);
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const passo = evento.key === "ArrowRight" ? 1 : -1;
    const proxima = ordem[(atual + passo + ordem.length) % ordem.length];
    if (!proxima) return;
    irPara(proxima);
    lista.current?.querySelector<HTMLButtonElement>(`[data-aba="${proxima}"]`)?.focus();
  }

  return (
    <div className="ficha">
      <nav aria-label="Trilha da ficha" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-paper-ink-3">
        <Link href="/pacientes" className="text-paper-ink-3 no-underline hover:underline">
          Pacientes
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-tinta">{nome}</span>
      </nav>

      <header className="rounded-paper-md border border-borda-papel bg-card p-6 shadow-paper-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-5">
            <span
              className="grid size-16 shrink-0 place-items-center rounded-full bg-paper-avatar-fundo font-heading text-xl font-semibold text-paper-status-agendado-tinta"
              aria-hidden="true"
            >
              {iniciaisNome}
            </span>
            <div className="min-w-0">
              <h1 className="m-0 font-heading text-[28px] leading-9 font-bold text-tinta">{nome}</h1>
              <p className="mt-1 mb-0 text-sm text-paper-ink-2">{meta}</p>
              {responsavel ? <p className="mt-1 mb-0 text-sm text-paper-ink-2">Responsável: {responsavel}</p> : null}
              <ul className="mt-2 mb-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
                {canais.map((canal) => (
                  <li key={`${canal.canal}-${canal.contato}`} className="flex items-center gap-2 text-[13px] text-tinta">
                    <IconeCanal canal={canal.canal} />
                    <span>{canal.contato}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap justify-end gap-3">
              {podeEvoluir ? (
                <Button type="button" variant="outline" className="h-10 gap-2 rounded-paper-sm px-4" onClick={() => irPara("evolucoes")}>
                  <Pencil aria-hidden="true" />
                  Registrar evolução
                </Button>
              ) : null}
              <Link href={destinoAgenda} className={cn(buttonVariants({ variant: "default" }), "h-10 gap-2 rounded-paper-sm px-4")}>
                <Calendar aria-hidden="true" />
                Agendar consulta
              </Link>
            </div>
            <ul className="m-0 flex list-none flex-wrap justify-end gap-2 p-0">
              {alertas.map((alerta) => (
                <li key={`${alerta.tipo}-${alerta.titulo}`}>
                  <Badge
                    variant={alerta.tipo === "alergia" ? "destructive" : "warning"}
                    className="h-[22px] gap-1.5 rounded-full px-2 text-xs font-medium"
                  >
                    <span
                      aria-hidden="true"
                      className={alerta.tipo === "alergia" ? "size-1.5 rounded-full bg-perigo" : "size-1.5 rounded-full bg-aviso"}
                    />
                    {alerta.titulo}
                  </Badge>
                </li>
              ))}
              {debitoRotulo ? (
                <li>
                  <Badge variant="warning" className="h-[22px] gap-1.5 rounded-full px-2 text-xs font-medium">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-aviso" />
                    {debitoRotulo}
                  </Badge>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </header>

      <div
        ref={lista}
        role="tablist"
        aria-label="Seções do prontuário"
        className="mt-4 flex gap-7 overflow-x-auto border-b border-borda-papel"
        onKeyDown={noTeclado}
      >
        {abas.map((item) => {
          const ativa = item.id === aba;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`aba-${item.id}`}
              data-aba={item.id}
              aria-selected={ativa}
              aria-controls={`painel-${item.id}`}
              tabIndex={ativa ? 0 : -1}
              className={`inline-flex h-11 shrink-0 items-center gap-2 border-0 border-b-2 bg-transparent px-0 text-sm ${
                ativa ? "border-destaque font-medium text-tinta" : "border-transparent font-normal text-paper-ink-3"
              }`}
              onClick={() => irPara(item.id)}
            >
              {item.rotulo}
              {item.contagem && item.contagem > 0 ? (
                <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-paper-tint-neutral px-1.5 font-mono text-xs text-paper-ink-2">
                  {item.contagem}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        <div
          ref={painel}
          id={`painel-${aba}`}
          role="tabpanel"
          aria-labelledby={`aba-${aba}`}
          tabIndex={-1}
          className="min-w-0 outline-none"
        >
          {paineis[aba]}
        </div>
        {lateral}
      </div>
    </div>
  );
}
