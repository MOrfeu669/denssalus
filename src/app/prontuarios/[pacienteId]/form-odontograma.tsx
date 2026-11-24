"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
    <Label className="flex-col items-stretch gap-1.5">
      {rotulo}
      <NativeSelect name="procedimentoId" defaultValue="" required>
        <NativeSelectOption value="">Selecione</NativeSelectOption>
        {procedimentos.map((procedimento) => (
          <NativeSelectOption key={procedimento.id} value={procedimento.id}>
            {procedimento.nome}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Label>
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
        <Label className="flex-col items-stretch gap-1.5">
          Agendamento
          <NativeSelect name="agendamentoId" defaultValue="" required>
            <NativeSelectOption value="">Selecione</NativeSelectOption>
            {agendamentos.map((agendamento) => (
              <NativeSelectOption key={agendamento.id} value={agendamento.id}>
                {`${dataAgendamento(agendamento.inicio)} · ${agendamento.status} · ${agendamento.id.slice(0, 8)}`}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <Procedimentos rotulo="Procedimento realizado" procedimentos={procedimentos} />
        <BotaoEnviar>Registrar no dente</BotaoEnviar>
      </form>

      <Aviso tipo={preExistente.status} mensagem={preExistente.mensagem} />
      <form action={acaoPre} aria-busy={pendentePre}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="dente" value={dente} />
        <Procedimentos rotulo="Procedimento pré-existente" procedimentos={procedimentos} />
        <BotaoEnviar>Registrar pré-existente</BotaoEnviar>
      </form>

      <Aviso tipo={edicao.status} mensagem={edicao.mensagem} />
      <form action={acaoEditar} aria-busy={pendenteEditar}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <Label className="flex-col items-stretch gap-1.5">
          Registro a editar
          <NativeSelect name="registroId" defaultValue={confirmados.at(-1)?.id ?? ""} required>
            <NativeSelectOption value="">Selecione</NativeSelectOption>
            {confirmados.map((registro) => (
              <NativeSelectOption key={registro.id} value={registro.id}>
                {`${procedimentos.find((item) => item.id === registro.procedimentoId)?.nome ?? registro.procedimentoId} · ${registro.id.slice(0, 8)}`}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <Procedimentos rotulo="Novo procedimento" procedimentos={procedimentos} />
        <BotaoEnviar>Salvar registro</BotaoEnviar>
      </form>
    </>
  );
}
