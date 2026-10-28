"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { RegistroOdontograma } from "../../../domain/odontograma/tipos";
import { Aviso } from "../../aviso";
import { estadoVazio } from "../../formulario";
import { editarRegistro, registrarNoDente, registrarPreExistente } from "./acoes-odontograma";
import { dataAgendamento } from "./formato";
import type { AgendamentoOpcao, ProcedimentoOpcao } from "./tipos-odontograma";

function Procedimentos({
  rotulo,
  procedimentos,
}: {
  rotulo: string;
  procedimentos: ProcedimentoOpcao[];
}) {
  return (
    <label>
      {rotulo}
      <select name="procedimentoId" defaultValue="" required>
        <option value="">Selecione</option>
        {procedimentos.map((procedimento) => (
          <option key={procedimento.id} value={procedimento.id}>
            {procedimento.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FormulariosDoDente({
  pacienteId,
  dente,
  confirmados,
  procedimentos,
  agendamentos,
}: {
  pacienteId: string;
  dente: number;
  confirmados: RegistroOdontograma[];
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
}) {
  const roteador = useRouter();
  const [atendimento, acaoAtendimento, pendenteAtendimento] = useActionState(
    registrarNoDente,
    estadoVazio,
  );
  const [preExistente, acaoPre, pendentePre] = useActionState(registrarPreExistente, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editarRegistro, estadoVazio);

  useEffect(() => {
    if ([atendimento, preExistente, edicao].some((item) => item.status === "sucesso")) {
      roteador.refresh();
    }
  }, [atendimento, preExistente, edicao, roteador]);

  return (
    <>
      <Aviso tipo={atendimento.status} mensagem={atendimento.mensagem} />
      <form action={acaoAtendimento} aria-busy={pendenteAtendimento}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="dente" value={dente} />
        <label>
          Agendamento
          <select name="agendamentoId" defaultValue="" required>
            <option value="">Selecione</option>
            {agendamentos.map((agendamento) => (
              <option key={agendamento.id} value={agendamento.id}>
                {`${dataAgendamento(agendamento.inicio)} · ${agendamento.status} · ${agendamento.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </label>
        <Procedimentos rotulo="Procedimento realizado" procedimentos={procedimentos} />
        <button type="submit" disabled={pendenteAtendimento}>
          Registrar no dente
        </button>
      </form>

      <Aviso tipo={preExistente.status} mensagem={preExistente.mensagem} />
      <form action={acaoPre} aria-busy={pendentePre}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="dente" value={dente} />
        <Procedimentos rotulo="Procedimento pré-existente" procedimentos={procedimentos} />
        <button type="submit" disabled={pendentePre}>
          Registrar pré-existente
        </button>
      </form>

      <Aviso tipo={edicao.status} mensagem={edicao.mensagem} />
      <form action={acaoEditar} aria-busy={pendenteEditar}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <label>
          Registro a editar
          <select name="registroId" defaultValue={confirmados.at(-1)?.id ?? ""} required>
            <option value="">Selecione</option>
            {confirmados.map((registro) => (
              <option key={registro.id} value={registro.id}>
                {`${procedimentos.find((item) => item.id === registro.procedimentoId)?.nome ?? registro.procedimentoId} · ${registro.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </label>
        <Procedimentos rotulo="Novo procedimento" procedimentos={procedimentos} />
        <button type="submit" disabled={pendenteEditar}>
          Salvar registro
        </button>
      </form>
    </>
  );
}
