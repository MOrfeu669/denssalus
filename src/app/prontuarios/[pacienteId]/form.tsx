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
}: {
  pacienteId: string;
  agendamentoId: string;
  rotulo: string;
  texto: string;
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
