"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Aviso } from "../../aviso";
import { estadoVazio } from "../../formulario";
import { registrarAnamnese, registrarEvolucao } from "./actions";

export function FormularioAnamnese({
  pacienteId,
  conteudo,
}: {
  pacienteId: string;
  conteudo: string;
}) {
  const roteador = useRouter();
  const [resultado, acao, pendente] = useActionState(registrarAnamnese, estadoVazio);

  useEffect(() => {
    if (resultado.status === "sucesso") roteador.refresh();
  }, [resultado, roteador]);

  return (
    <>
      <Aviso tipo={resultado.status} mensagem={resultado.mensagem} />
      <form action={acao} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <Label className="flex-col items-stretch gap-1.5">
          Anamnese
          <Textarea name="conteudo" defaultValue={conteudo} rows={6} />
        </Label>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar anamnese"}
        </Button>
      </form>
    </>
  );
}

export function FormularioEvolucao({
  pacienteId,
  agendamentoId,
  rotulo,
  texto,
  materiais,
}: {
  pacienteId: string;
  agendamentoId: string;
  rotulo: string;
  texto: string;
  materiais?: { materialId: string; nome: string; quantidade: number }[];
}) {
  const roteador = useRouter();
  const [resultado, acao, pendente] = useActionState(registrarEvolucao, estadoVazio);

  useEffect(() => {
    if (resultado.status === "sucesso") roteador.refresh();
  }, [resultado, roteador]);

  return (
    <>
      <Aviso tipo={resultado.status} mensagem={resultado.mensagem} />
      <form action={acao} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="agendamentoId" value={agendamentoId} />
        {materiais?.map((material) => (
          <div key={material.materialId}>
            <input type="hidden" name="materialId" value={material.materialId} />
            <Label className="flex-col items-stretch gap-1.5">
              {`Quantidade usada de ${material.nome}`}
              <Input
                type="number"
                name={`quantidade-${material.materialId}`}
                defaultValue={material.quantidade}
                min={0}
                step={1}
              />
            </Label>
          </div>
        ))}
        <Label className="flex-col items-stretch gap-1.5">
          {`Evolução da consulta de ${rotulo}`}
          <Textarea name="texto" defaultValue={texto} rows={5} />
        </Label>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar evolução"}
        </Button>
      </form>
    </>
  );
}
