"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Aviso } from "../aviso";
import { estadoVazio } from "../formulario";
import { cadastrar } from "./actions";

const campo =
  "h-10 border-campo-borda bg-campo shadow-paper-sm hover:border-campo-borda-hover focus-visible:border-destaque focus-visible:outline-destaque disabled:border-borda-papel disabled:bg-desabilitado disabled:text-desabilitado-tinta aria-invalid:border-perigo";

const botao =
  "h-10 border-transparent bg-primary px-4 text-primary-foreground shadow-paper-sm hover:bg-(--paper-primary-hover) disabled:opacity-50";

export function FormularioLaboratorio({ nomes }: { nomes: string[] }) {
  const roteador = useRouter();
  const foco = useRef<HTMLParagraphElement>(null);
  const [resposta, executar, pendente] = useActionState(cadastrar, estadoVazio);

  useEffect(() => {
    if (resposta.status === "sucesso") roteador.refresh();
    if (resposta.status !== "vazio") foco.current?.focus();
  }, [resposta, roteador]);

  return (
    <div className="flex flex-col gap-4">
      <div ref={foco} tabIndex={-1}>
        <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      </div>
      <form action={executar} aria-busy={pendente} className="flex flex-wrap items-end gap-3">
        <Label className="w-full max-w-sm flex-col items-start gap-1.5">
          Nome do laboratório
          <Input name="nome" required className={campo} />
        </Label>
        <Button type="submit" disabled={pendente} className={botao}>
          {pendente ? "Salvando…" : "Cadastrar laboratório"}
        </Button>
      </form>
      {nomes.length === 0 ? (
        <p className="m-0 text-apagado">Nenhum laboratório cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Laboratório</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nomes.map((nome) => (
              <TableRow key={nome}>
                <TableCell className="whitespace-normal">{nome}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
