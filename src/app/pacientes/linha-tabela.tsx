"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SituacaoLista } from "../../domain/paciente/lista";
import { MenuLinha } from "./menu-linha";
import { ROTULO_SITUACAO } from "./texto";
import type { LinhaVisivel } from "./tipos-lista";

const TOM: Record<SituacaoLista, { fundo: string; tinta: string; ponto: string }> = {
  em_tratamento: {
    fundo: "bg-paper-tint-purple",
    tinta: "text-paper-status-agendado-tinta",
    ponto: "bg-paper-status-agendado",
  },
  debito_em_aberto: {
    fundo: "bg-paper-tint-warning",
    tinta: "text-paper-status-em-espera-tinta",
    ponto: "bg-paper-status-em-espera",
  },
  retorno_pendente: { fundo: "bg-paper-tint-blue", tinta: "text-[#1E40AF]", ponto: "bg-[#2563EB]" },
  alta: {
    fundo: "bg-paper-tint-success",
    tinta: "text-paper-status-concluido-tinta",
    ponto: "bg-paper-status-concluido",
  },
  inativo: { fundo: "bg-paper-tint-neutral", tinta: "text-paper-ink-2", ponto: "bg-paper-status-cancelado" },
};

const AVATAR: Record<SituacaoLista, string> = {
  em_tratamento: "bg-[#E9E3FF] text-[#5B21B6]",
  debito_em_aberto: "bg-paper-tint-warning text-paper-status-em-espera-tinta",
  retorno_pendente: "bg-paper-tint-blue text-[#1E40AF]",
  alta: "bg-paper-tint-success text-paper-status-concluido-tinta",
  inativo: "bg-paper-tint-neutral text-paper-ink-2",
};

export function LinhaTabela({
  linha,
  marcada,
  onMarcar,
  onEditar,
}: {
  linha: LinhaVisivel;
  marcada: boolean;
  onMarcar: (marcado: boolean) => void;
  onEditar: (id: string) => void;
}) {
  const tom = TOM[linha.situacao];
  return (
    <TableRow data-state={marcada ? "selected" : undefined} className="h-[60px] hover:bg-paper-subtle data-[state=selected]:bg-paper-subtle">
      <TableCell className="px-4 py-0">
        <Checkbox
          checked={marcada}
          aria-label={`Selecionar ${linha.nome}`}
          onCheckedChange={(valor) => onMarcar(valor === true)}
        />
      </TableCell>
      <TableCell className="px-4 py-0">
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn("grid size-9 shrink-0 place-items-center rounded-full font-heading text-xs font-semibold", AVATAR[linha.situacao])}
          >
            {linha.iniciais}
          </span>
          <span className="min-w-0">
            <Link href={`/prontuarios/${linha.id}`} className="block truncate text-sm font-medium text-tinta no-underline hover:underline">
              {linha.nome}
            </Link>
            <span className="block truncate text-xs leading-4 text-paper-ink-3">{linha.complemento}</span>
          </span>
        </span>
      </TableCell>
      <TableCell className="px-4 py-0 text-sm tabular-nums text-tinta">{linha.cpf}</TableCell>
      <TableCell className="px-4 py-0 text-sm tabular-nums text-tinta">{linha.telefone}</TableCell>
      <TableCell className="px-4 py-0 text-sm tabular-nums text-tinta">{linha.ultimaVisita}</TableCell>
      <TableCell className="px-4 py-0 text-sm tabular-nums">
        {linha.proximaConsulta ? (
          <span className="inline-flex items-center gap-2 text-tinta">
            <Calendar className="size-4 text-paper-ink-3" aria-hidden="true" />
            {linha.proximaConsulta}
          </span>
        ) : (
          <span className="text-[#A3A193]">Sem agendamento</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-0">
        <span className={cn("inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-xs leading-4 font-medium", tom.fundo, tom.tinta)}>
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", tom.ponto)} />
          {ROTULO_SITUACAO[linha.situacao]}
        </span>
      </TableCell>
      <TableCell className="px-2 py-0 text-right">
        <MenuLinha id={linha.id} nome={linha.nome} onEditar={onEditar} />
      </TableCell>
    </TableRow>
  );
}
