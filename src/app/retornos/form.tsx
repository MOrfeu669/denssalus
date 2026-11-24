"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RetornoVisivel } from "../../domain/retorno/tipos";
import { estadoVazio } from "../formulario";
import { salvarPrazo } from "./actions";
import { Alerta } from "./alerta";
import {
  NOTA_LISTA,
  PENDENTE_MARCAR,
  PENDENTE_PRAZO,
  ROTULO_DATA_PREVISTA,
  ROTULO_IR_AGENDAMENTOS,
  ROTULO_MARCAR_RETORNO,
  ROTULO_PRAZO,
  ROTULO_REAGENDAR,
  ROTULO_SALVAR_PRAZO,
  TEXTO_MARCAR,
  TITULO_LISTA,
  TITULO_MARCAR,
  TITULO_PRAZO,
  VAZIO_RETORNOS,
  hrefReagendar,
  textoPrazo,
  textoPrevisto,
} from "./texto";
import "./tela.css";

export function Retornos({ retornos }: { retornos: RetornoVisivel[] }) {
  return (
    <section className="retornos-secao" aria-labelledby="retornos-lista-titulo">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 id="retornos-lista-titulo">{TITULO_LISTA}</h2>
          {retornos.length === 0 ? (
            <p className="retornos-vazio">{VAZIO_RETORNOS}</p>
          ) : (
            <>
              <p className="retornos-nota">{NOTA_LISTA}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Retorno</TableHead>
                    <TableHead>Previsto</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retornos.map((retorno) => (
                    <TableRow key={retorno.id}>
                      <TableCell className="whitespace-normal font-semibold">{retorno.texto}</TableCell>
                      <TableCell className="whitespace-normal text-apagado">{textoPrevisto(retorno.dataPrevista)}</TableCell>
                      <TableCell className="text-right">
                        <Link className="casca-botao" href={hrefReagendar(retorno.pacienteId)}>
                          {ROTULO_REAGENDAR}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// Quem marca (admin e dentista) é levado ao agendamento: o retorno nasce de uma consulta concluída.
export function RegiaoMarcar() {
  return (
    <section className="retornos-secao" aria-labelledby="retornos-marcar-titulo">
      <Card>
        <CardContent className="flex flex-col items-start gap-3">
          <h2 id="retornos-marcar-titulo">{TITULO_MARCAR}</h2>
          <p className="retornos-nota">{TEXTO_MARCAR}</p>
          <Link className="casca-botao" href="/agenda">
            {ROTULO_IR_AGENDAMENTOS}
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

export function FormularioPrazo({ prazo }: { prazo: number }) {
  const roteador = useRouter();
  const [resultado, acao, pendente] = useActionState(salvarPrazo, estadoVazio);

  useEffect(() => {
    if (resultado.status === "sucesso") roteador.refresh();
  }, [resultado, roteador]);

  return (
    <section className="retornos-secao retornos-prazo" aria-labelledby="retornos-prazo-titulo">
      <Card className="shadow-paper-md">
        <CardContent className="flex flex-col gap-4">
          <h2 id="retornos-prazo-titulo">{TITULO_PRAZO}</h2>
          <p className="retornos-prazo-aviso">{textoPrazo(prazo)}</p>
          {resultado.status === "vazio" ? null : (
            <Alerta tipo={resultado.status} mensagem={resultado.mensagem} quando={resultado.quando} />
          )}
          <form className="retornos-form" action={acao} aria-busy={pendente}>
            <Label className="retornos-campo">
              {ROTULO_PRAZO}
              <Input name="diasAntecedencia" type="number" min={1} step={1} defaultValue={prazo} required />
            </Label>
            <Button className="retornos-botao" type="submit" disabled={pendente}>
              {pendente ? PENDENTE_PRAZO : ROTULO_SALVAR_PRAZO}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export function FormularioMarcarRetorno({
  id,
  acao,
  pendente,
}: {
  id: string;
  acao: (formData: FormData) => void;
  pendente: boolean;
}) {
  return (
    <form className="retornos-form retornos-form-marcar" action={acao} aria-busy={pendente}>
      <input type="hidden" name="agendamentoOrigemId" value={id} />
      <Label className="retornos-campo">
        {ROTULO_DATA_PREVISTA}
        <Input name="dataPrevista" type="date" required />
      </Label>
      <Button className="retornos-botao" type="submit" disabled={pendente}>
        {pendente ? PENDENTE_MARCAR : ROTULO_MARCAR_RETORNO}
      </Button>
    </form>
  );
}
