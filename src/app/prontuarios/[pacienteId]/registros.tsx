"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RegistroOdontograma } from "../../../domain/odontograma/tipos";
import { dataRegistro } from "./ficha-dados";
import type { ProcedimentoOpcao } from "./tipos-odontograma";

const LIMITE = 5;

function Selo({ status }: { status: RegistroOdontograma["status"] }) {
  const confirmado = status === "confirmado";
  return (
    <Badge
      className={
        confirmado
          ? "h-[22px] gap-1.5 rounded-full bg-paper-tint-success px-2 text-xs font-medium text-paper-status-concluido-tinta"
          : "h-[22px] gap-1.5 rounded-full bg-paper-tint-neutral px-2 text-xs font-medium text-paper-ink-2"
      }
    >
      <span
        aria-hidden="true"
        className={confirmado ? "size-1.5 rounded-full bg-paper-status-concluido" : "size-1.5 rounded-full bg-paper-ink-3"}
      />
      {confirmado ? "confirmado" : "revertido"}
    </Badge>
  );
}

export function RegistrosClinicos({
  registros,
  procedimentos,
  selecionado,
}: {
  registros: RegistroOdontograma[];
  procedimentos: ProcedimentoOpcao[];
  selecionado: number | null;
}) {
  const [todos, setTodos] = useState(false);
  const ordenados = [...registros].sort((a, b) => b.registradoEm.localeCompare(a.registradoEm));
  const visiveis = todos ? ordenados : ordenados.slice(0, LIMITE);
  const nome = (id: string) => procedimentos.find((item) => item.id === id)?.nome ?? "Procedimento";

  return (
    <section className="rounded-paper-md border border-borda-papel bg-card shadow-paper-sm" aria-labelledby="registros-clinicos">
      <div className="flex items-start justify-between gap-3 px-6 pt-5">
        <div>
          <h2 id="registros-clinicos" className="m-0 font-heading text-lg leading-6 font-semibold text-tinta">
            Registros clínicos
          </h2>
          <p className="mt-1 mb-0 text-[13px] leading-[18px] text-paper-ink-3">Últimos procedimentos no odontograma</p>
        </div>
        {ordenados.length > LIMITE ? (
          <Button
            type="button"
            variant="ghost"
            className="h-8 gap-1 px-2 text-sm font-medium text-tinta"
            aria-expanded={todos}
            onClick={() => setTodos((atual) => !atual)}
          >
            {todos ? "Mostrar os últimos" : "Ver todos"}
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {ordenados.length === 0 ? (
        <p className="px-6 py-6 text-sm text-paper-ink-2">Nenhum registro no odontograma.</p>
      ) : (
        <div className="ficha-registros mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                {["Data", "Dente", "Procedimento", "Origem", "Status"].map((coluna) => (
                  <TableHead
                    key={coluna}
                    className="h-10 font-mono text-[11px] font-normal tracking-wide text-paper-ink-3 uppercase"
                  >
                    {coluna}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((registro) => (
                <TableRow
                  key={registro.id}
                  data-state={selecionado === registro.dente ? "selected" : undefined}
                  className={selecionado === registro.dente ? "bg-paper-subtle" : undefined}
                >
                  <TableCell className="tabular-nums whitespace-normal">{dataRegistro(registro.registradoEm)}</TableCell>
                  <TableCell className="font-mono tabular-nums">{registro.dente}</TableCell>
                  <TableCell className="whitespace-normal">{nome(registro.procedimentoId)}</TableCell>
                  <TableCell className="whitespace-normal">
                    {registro.origem === "pre_existente" ? "Pré-existente" : "Atendimento"}
                  </TableCell>
                  <TableCell>
                    <Selo status={registro.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
