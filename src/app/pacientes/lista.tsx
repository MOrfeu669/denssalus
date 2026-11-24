"use client";

import { Calendar, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CHIPS_LISTA, POR_PAGINA, type ChipLista } from "../../domain/paciente/lista";
import { DEBOUNCE_FILTRO_MS, hrefDaLista, paginasDaLista, type ConsultaLista } from "./consulta";
import { LinhaTabela } from "./linha-tabela";
import {
  ROTULO_CHIP,
  TEXTO_AGENDAR_UM,
  TEXTO_FILTRO_VAZIO,
  TEXTO_MENSAGEM_LOTE,
  TEXTO_VAZIO,
  textoContagem,
  textoFaixa,
  textoSelecao,
} from "./texto";
import type { PaginaLista } from "./tipos-lista";

export function ListaPacientes({
  pagina,
  consulta,
  selecionados,
  onSelecionar,
  onEditar,
}: {
  pagina: PaginaLista;
  consulta: ConsultaLista;
  selecionados: string[];
  onSelecionar: (ids: string[]) => void;
  onEditar: (id: string) => void;
}) {
  const roteador = useRouter();
  const [pendente, iniciar] = useTransition();
  const [termo, setTermo] = useState(consulta.termo);
  const [mensagemAberta, setMensagemAberta] = useState(false);
  const enviado = useRef(consulta.termo);
  const chipRef = useRef(consulta.chip);
  chipRef.current = consulta.chip;

  useEffect(() => {
    if (consulta.termo === enviado.current) return;
    enviado.current = consulta.termo;
    setTermo(consulta.termo);
  }, [consulta.termo]);

  useEffect(() => {
    if (termo.trim() === consulta.termo) return;
    const timer = window.setTimeout(() => {
      enviado.current = termo.trim();
      const destino = hrefDaLista(
        { ...consulta, chip: chipRef.current },
        { termo, pagina: 1 },
      );
      iniciar(() => roteador.replace(destino));
    }, DEBOUNCE_FILTRO_MS);
    return () => window.clearTimeout(timer);
  }, [termo, consulta, roteador]);

  function aoChip(chip: ChipLista) {
    chipRef.current = chip;
    if (chip === consulta.chip && termo.trim() === consulta.termo) return;
    enviado.current = termo.trim();
    iniciar(() => roteador.replace(hrefDaLista({ ...consulta, termo }, { chip, pagina: 1 })));
  }

  function aoLinhas(valor: string) {
    iniciar(() => roteador.replace(hrefDaLista(consulta, { porPagina: Number(valor), pagina: 1 })));
  }

  const idsPagina = pagina.linhas.map((linha) => linha.id);
  const todos = idsPagina.length > 0 && idsPagina.every((id) => selecionados.includes(id));

  function alternarPagina(marcado: boolean) {
    if (marcado) onSelecionar([...new Set([...selecionados, ...idsPagina])]);
    else onSelecionar(selecionados.filter((id) => !idsPagina.includes(id)));
  }

  function alternarLinha(id: string, marcado: boolean) {
    onSelecionar(marcado ? [...selecionados, id] : selecionados.filter((item) => item !== id));
  }

  const paginas = paginasDaLista(pagina.pagina, pagina.totalFiltrado, pagina.porPagina);
  const anterior = pagina.pagina > 1 ? pagina.pagina - 1 : null;
  const proxima = pagina.pagina * pagina.porPagina < pagina.totalFiltrado ? pagina.pagina + 1 : null;

  return (
    <div aria-busy={pendente} className={pendente ? "opacity-80" : undefined}>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative w-[360px] max-w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-paper-ink-3" aria-hidden="true" />
          <Input
            type="search"
            value={termo}
            placeholder="Buscar por nome, CPF ou telefone"
            aria-label="Filtrar a lista de pacientes"
            autoComplete="off"
            className="h-10 rounded-paper-sm border-campo-borda pr-3 pl-10 placeholder:text-[#8A887A]"
            onChange={(evento) => setTermo(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter") evento.preventDefault();
            }}
          />
        </div>
        {CHIPS_LISTA.map((chip) => {
          const ativo = consulta.chip === chip;
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={ativo}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium",
                ativo ? "bg-primary text-white" : "border border-borda-papel bg-card text-tinta",
              )}
              onClick={() => aoChip(chip)}
            >
              {ROTULO_CHIP[chip]}
              <span className={cn("text-xs font-medium tabular-nums", ativo ? "text-[#C9C9C0]" : "text-paper-ink-3")}>
                {textoContagem(pagina.contagens[chip])}
              </span>
            </button>
          );
        })}
      </div>
      <Table className="min-w-[1128px]">
        <TableHeader className="bg-paper-subtle">
          <TableRow className="hover:bg-paper-subtle">
            <TableHead className="w-[52px] px-4">
              <Checkbox
                checked={todos}
                disabled={pagina.linhas.length === 0}
                aria-label="Selecionar pacientes desta página"
                onCheckedChange={(marcado) => alternarPagina(marcado === true)}
              />
            </TableHead>
            {["Paciente", "CPF", "Telefone", "Última visita", "Próxima consulta", "Situação"].map((coluna) => (
              <TableHead
                key={coluna}
                className="h-10 px-4 font-mono text-[11px] font-normal tracking-[0.06em] text-paper-ink-3 uppercase"
              >
                {coluna}
              </TableHead>
            ))}
            <TableHead className="w-14 px-4">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagina.linhas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-base text-paper-ink-2">
                {pagina.totalClinica === 0 ? TEXTO_VAZIO : TEXTO_FILTRO_VAZIO}
              </TableCell>
            </TableRow>
          ) : (
            pagina.linhas.map((linha) => (
              <LinhaTabela
                key={linha.id}
                linha={linha}
                marcada={selecionados.includes(linha.id)}
                onMarcar={(marcado) => alternarLinha(linha.id, marcado)}
                onEditar={onEditar}
              />
            ))
          )}
        </TableBody>
        <TableFooter className="border-borda-papel bg-card font-normal">
          <tr>
            <td colSpan={8} className="px-6 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-sm text-paper-ink-2" aria-live="polite">
                  {textoFaixa(pagina.pagina, pagina.porPagina, pagina.totalFiltrado)}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-paper-ink-3">
                    Linhas por página
                    <NativeSelect
                      className="w-[76px]"
                      aria-label="Linhas por página"
                      value={String(consulta.porPagina)}
                      onChange={(evento) => aoLinhas(evento.target.value)}
                    >
                      {POR_PAGINA.map((quantidade) => (
                        <NativeSelectOption key={quantidade} value={String(quantidade)}>
                          {quantidade}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                  <nav aria-label="Paginação" className="flex items-center gap-1.5">
                    <Passo href={anterior ? hrefDaLista(consulta, { pagina: anterior }) : null} rotulo="Página anterior">
                      ‹
                    </Passo>
                    {paginas.map((item, indice) =>
                      item === "…" ? (
                        <span key={`reticencias-${indice}`} className="px-1 text-sm text-paper-ink-3">
                          …
                        </span>
                      ) : (
                        <Link
                          key={item}
                          href={hrefDaLista(consulta, { pagina: item })}
                          aria-label={`Página ${item}`}
                          aria-current={item === pagina.pagina ? "page" : undefined}
                          className={cn(
                            "inline-flex h-9 min-w-9 items-center justify-center rounded-paper-sm px-2 text-sm font-medium no-underline",
                            item === pagina.pagina
                              ? "bg-primary text-white"
                              : "border border-borda-papel bg-card text-tinta",
                          )}
                        >
                          {item}
                        </Link>
                      ),
                    )}
                    <Passo href={proxima ? hrefDaLista(consulta, { pagina: proxima }) : null} rotulo="Próxima página">
                      ›
                    </Passo>
                  </nav>
                </div>
              </div>
            </td>
          </tr>
        </TableFooter>
      </Table>
      {selecionados.length > 0 ? (
        <div className="pacientes-selecao" role="region" aria-label="Ações da seleção">
          <p className="m-0 mr-auto text-sm font-medium">{textoSelecao(selecionados.length)}</p>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-md bg-[#2A2A2A] px-3 text-[13px] font-medium text-white"
            onClick={() => setMensagemAberta(true)}
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            Enviar mensagem
          </button>
          {selecionados.length === 1 ? (
            <Link
              href={`/agendamentos?paciente=${selecionados[0]}`}
              className="inline-flex h-8 items-center gap-2 rounded-md bg-[#2A2A2A] px-3 text-[13px] font-medium text-white no-underline"
            >
              <Calendar className="size-4" aria-hidden="true" />
              Agendar
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title={TEXTO_AGENDAR_UM}
              className="inline-flex h-8 items-center gap-2 rounded-md bg-[#2A2A2A] px-3 text-[13px] font-medium text-white opacity-50"
            >
              <Calendar className="size-4" aria-hidden="true" />
              Agendar
            </button>
          )}
        </div>
      ) : null}
      <Dialog open={mensagemAberta} onOpenChange={setMensagemAberta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar mensagem</DialogTitle>
            <DialogDescription>{TEXTO_MENSAGEM_LOTE}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Passo({ href, rotulo, children }: { href: string | null; rotulo: string; children: string }) {
  if (!href) {
    return (
      <span aria-hidden="true" className="inline-flex h-9 min-w-9 items-center justify-center rounded-paper-sm border border-borda-papel text-paper-ink-3">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={rotulo}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-paper-sm border border-borda-papel bg-card text-sm font-medium text-tinta no-underline"
    >
      {children}
    </Link>
  );
}

