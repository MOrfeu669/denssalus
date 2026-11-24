"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ItemPlano } from "../../../domain/plano/tipos";
import { Aviso } from "../../aviso";
import { estadoVazio, type EstadoFormulario } from "../../formulario";
import { adicionarItem, criarPlano, editarItem, marcarEmAndamento } from "./acoes-plano";
import { dataAgendamento } from "./formato";
import type { AgendamentoOpcao, ProcedimentoOpcao } from "./tipos-odontograma";

type Acao = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

function useFormulario(acao: Acao) {
  const roteador = useRouter();
  const [resposta, executar, pendente] = useActionState(acao, estadoVazio);
  useEffect(() => {
    if (resposta.status === "sucesso") roteador.refresh();
  }, [resposta, roteador]);
  return { resposta, executar, pendente };
}

function Campos({
  procedimentos,
  agendamentos,
  item,
}: {
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
  item?: ItemPlano;
}) {
  const atual = item?.agendamentoId ?? "";
  const semOpcao = atual !== "" && !agendamentos.some((opcao) => opcao.id === atual);
  return (
    <>
      <Label className="flex-col items-stretch gap-1.5">
        Procedimento
        <NativeSelect name="procedimentoId" defaultValue={item?.procedimentoId ?? ""} required>
          <NativeSelectOption value="">Selecione</NativeSelectOption>
          {procedimentos.map((procedimento) => (
            <NativeSelectOption key={procedimento.id} value={procedimento.id}>
              {procedimento.nome}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Label>
      <Label className="flex-col items-stretch gap-1.5">
        Dentes
        <Input type="text" name="dentes" defaultValue={item?.dentes.join(", ") ?? ""} />
      </Label>
      <Label className="flex-col items-stretch gap-1.5">
        Valor
        <Input type="number" name="valor" min="0" step="0.01" defaultValue={item ? item.valor : ""} />
      </Label>
      <Label className="flex-col items-stretch gap-1.5">
        Agendamento
        <NativeSelect name="agendamentoId" defaultValue={atual}>
          <NativeSelectOption value="">Sem agendamento</NativeSelectOption>
          {semOpcao ? <NativeSelectOption value={atual}>{atual.slice(0, 8)}</NativeSelectOption> : null}
          {agendamentos.map((agendamento) => (
            <NativeSelectOption key={agendamento.id} value={agendamento.id}>
              {`${dataAgendamento(agendamento.inicio)} · ${agendamento.status} · ${agendamento.id.slice(0, 8)}`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Label>
    </>
  );
}

export function FormularioCriarPlano({ pacienteId }: { pacienteId: string }) {
  const { resposta, executar, pendente } = useFormulario(criarPlano);
  return (
    <>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <Button type="submit" disabled={pendente}>
          Criar plano
        </Button>
      </form>
    </>
  );
}

export function FormularioEmAndamento({
  pacienteId,
  planoId,
}: {
  pacienteId: string;
  planoId: string;
}) {
  const { resposta, executar, pendente } = useFormulario(marcarEmAndamento);
  return (
    <>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="planoId" value={planoId} />
        <Button type="submit" variant="outline" className="prontuario-contorno" disabled={pendente}>
          Em andamento
        </Button>
      </form>
    </>
  );
}

export function FormularioAdicionarItem({
  pacienteId,
  planoId,
  procedimentos,
  agendamentos,
}: {
  pacienteId: string;
  planoId: string;
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
}) {
  const { resposta, executar, pendente } = useFormulario(adicionarItem);
  return (
    <>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="planoId" value={planoId} />
        <Campos procedimentos={procedimentos} agendamentos={agendamentos} />
        <Button type="submit" disabled={pendente}>
          Adicionar item
        </Button>
      </form>
    </>
  );
}

export function FormularioEditarItem({
  pacienteId,
  item,
  procedimentos,
  agendamentos,
}: {
  pacienteId: string;
  item: ItemPlano;
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
}) {
  const { resposta, executar, pendente } = useFormulario(editarItem);
  return (
    <>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="itemId" value={item.id} />
        <Campos procedimentos={procedimentos} agendamentos={agendamentos} item={item} />
        <Button type="submit" disabled={pendente}>
          Salvar item
        </Button>
      </form>
    </>
  );
}
