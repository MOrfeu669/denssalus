"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
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
      <label>
        Procedimento
        <select name="procedimentoId" defaultValue={item?.procedimentoId ?? ""} required>
          <option value="">Selecione</option>
          {procedimentos.map((procedimento) => (
            <option key={procedimento.id} value={procedimento.id}>
              {procedimento.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Dentes
        <input type="text" name="dentes" defaultValue={item?.dentes.join(", ") ?? ""} />
      </label>
      <label>
        Valor
        <input
          type="number"
          name="valor"
          min="0"
          step="0.01"
          defaultValue={item ? item.valor : ""}
        />
      </label>
      <label>
        Agendamento
        <select name="agendamentoId" defaultValue={atual}>
          <option value="">Sem agendamento</option>
          {semOpcao ? <option value={atual}>{atual.slice(0, 8)}</option> : null}
          {agendamentos.map((agendamento) => (
            <option key={agendamento.id} value={agendamento.id}>
              {`${dataAgendamento(agendamento.inicio)} · ${agendamento.status} · ${agendamento.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </label>
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
        <button type="submit" disabled={pendente}>
          Criar plano
        </button>
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
        <button type="submit" disabled={pendente}>
          Em andamento
        </button>
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
        <button type="submit" disabled={pendente}>
          Adicionar item
        </button>
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
        <button type="submit" disabled={pendente}>
          Salvar item
        </button>
      </form>
    </>
  );
}
