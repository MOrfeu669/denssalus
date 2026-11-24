import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampoDashboard } from "../../domain/dashboard/tipos";

export function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function data(valor: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : valor;
}

export function Bloco({
  campo,
  titulo,
  ocultos,
  pendente,
  ocultar,
  children,
}: {
  campo: CampoDashboard;
  titulo: string;
  ocultos: CampoDashboard[];
  pendente: boolean;
  ocultar: (campo: CampoDashboard) => void;
  children: ReactNode;
}) {
  if (ocultos.includes(campo)) return null;
  const id = `bloco-${campo}`;
  return (
    <section className={`dashboard-bloco dashboard-bloco-${campo}`} aria-labelledby={id}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id={id}>{titulo}</h2>
          </CardTitle>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-3 shadow-none"
              aria-describedby={id}
              disabled={pendente}
              onClick={() => ocultar(campo)}
            >
              Ocultar
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">{children}</CardContent>
      </Card>
    </section>
  );
}

export function Valores({
  titulo,
  itens,
  vazio,
}: {
  titulo: string;
  itens: { id: string; valor: number }[];
  vazio: string;
}) {
  if (itens.length === 0) return <p className="dashboard-vazio">{vazio}</p>;
  return (
    <Table aria-label={titulo}>
      <TableHeader>
        <TableRow>
          <TableHead>{titulo}</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {itens.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="whitespace-normal">{item.id}</TableCell>
            <TableCell className="text-right font-semibold whitespace-normal">{moeda(item.valor)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
