"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
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
        <label>
          Anamnese
          <textarea name="conteudo" defaultValue={conteudo} rows={6} />
        </label>
        <button type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar anamnese"}
        </button>
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
            <label>
              {`Quantidade usada de ${material.nome}`}
              <input
                type="number"
                name={`quantidade-${material.materialId}`}
                defaultValue={material.quantidade}
                min={0}
                step={1}
              />
            </label>
          </div>
        ))}
        <label>
          {`Evolução da consulta de ${rotulo}`}
          <textarea name="texto" defaultValue={texto} rows={5} />
        </label>
        <button type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar evolução"}
        </button>
      </form>
    </>
  );
}
