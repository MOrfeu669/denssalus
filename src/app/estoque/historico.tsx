"use client";

import type { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MaterialTela } from "./form";

const TIPO: Record<string, string> = {
  entrada: "Entrada",
  baixa: "Baixa",
  vencimento: "Vencimento",
};

const VARIANTE: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
  entrada: "success",
  baixa: "warning",
  vencimento: "destructive",
};

export function Historico({ material }: { material: MaterialTela }) {
  return (
    <details className="estoque-historico">
      <summary>{`Ver histórico de ${material.nome}`}</summary>
      {material.historico.length === 0 ? (
        <p className="estoque-vazio">Nenhuma movimentação registrada.</p>
      ) : (
        <Table aria-label={`Histórico de ${material.nome}`}>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Quando</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {material.historico.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant={VARIANTE[item.tipo] ?? "outline"}>{TIPO[item.tipo] ?? item.tipo}</Badge>
                </TableCell>
                <TableCell>{`${item.quantidade} unidades`}</TableCell>
                <TableCell className="whitespace-normal">{item.usuario}</TableCell>
                <TableCell className="whitespace-normal">{item.registradoEm}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </details>
  );
}
