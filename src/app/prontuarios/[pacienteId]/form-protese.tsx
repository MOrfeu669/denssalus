"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, type ReactNode } from "react";
import { Aviso } from "../../aviso";
import { estadoVazio, type EstadoFormulario } from "../../formulario";
import {
  conferirRetornoProtese,
  descontinuarPedidoProtese,
  instalarProteseAcao,
  registrarEnvioProtese,
  registrarPedidoProtese,
  salvarLimiteAtraso,
} from "./acoes-protese";
import { dataAgendamento } from "./formato";
import type { AgendamentoOpcao, ProcedimentoOpcao } from "./tipos-odontograma";
import type { ResponsavelOpcao } from "./tipos-protese";

type Acao = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

function useFormulario(acao: Acao) {
  const roteador = useRouter();
  const [resposta, executar, pendente] = useActionState(acao, estadoVazio);
  useEffect(() => {
    if (resposta.status === "sucesso") roteador.refresh();
  }, [resposta, roteador]);
  return { resposta, executar, pendente };
}

function SelectProcedimento({
  rotulo,
  nome,
  procedimentos,
}: {
  rotulo: string;
  nome: string;
  procedimentos: ProcedimentoOpcao[];
}) {
  return (
    <label>
      {rotulo}
      <select name={nome} defaultValue="">
        <option value="">Nenhum</option>
        {procedimentos.map((procedimento) => (
          <option key={procedimento.id} value={procedimento.id}>
            {procedimento.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FormularioPedido({
  pacienteId,
  responsaveis,
  procedimentos,
}: {
  pacienteId: string;
  responsaveis: ResponsavelOpcao[];
  procedimentos: ProcedimentoOpcao[];
}) {
  const { resposta, executar, pendente } = useFormulario(registrarPedidoProtese);
  return (
    <>
      <Aviso key={resposta.quando} tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <label>
          Tipo de prótese
          <input type="text" name="tipo" required />
        </label>
        <label>
          Dentes
          <input type="text" name="dentes" placeholder="14 15 16" />
        </label>
        <label>
          Responsável
          <select name="responsavelId" defaultValue="" required>
            <option value="">Selecione</option>
            {responsaveis.map((responsavel) => (
              <option key={responsavel.id} value={responsavel.id}>
                {responsavel.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Laboratório
          <input type="text" name="laboratorio" required />
        </label>
        <SelectProcedimento
          rotulo="Avaliação/Consulta"
          nome="procedimentoAvaliacaoId"
          procedimentos={procedimentos}
        />
        <SelectProcedimento
          rotulo="Cirurgia de implante"
          nome="procedimentoCirurgiaId"
          procedimentos={procedimentos}
        />
        <button type="submit" disabled={pendente}>
          Registrar pedido
        </button>
      </form>
    </>
  );
}

function FormularioDaProtese({
  acao,
  pacienteId,
  proteseId,
  rotulo,
  children,
}: {
  acao: Acao;
  pacienteId: string;
  proteseId: string;
  rotulo: string;
  children?: ReactNode;
}) {
  const { resposta, executar, pendente } = useFormulario(acao);
  return (
    <>
      <Aviso key={resposta.quando} tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="proteseId" value={proteseId} />
        {children}
        <button type="submit" disabled={pendente}>
          {rotulo}
        </button>
      </form>
    </>
  );
}

type Ids = { pacienteId: string; proteseId: string };

export function FormularioEnvio(ids: Ids) {
  return (
    <FormularioDaProtese acao={registrarEnvioProtese} rotulo="Registrar envio" {...ids}>
      <label>
        Prazo de retorno
        <input type="date" name="prazoRetorno" />
      </label>
    </FormularioDaProtese>
  );
}

export function FormularioConferencia(ids: Ids) {
  return (
    <FormularioDaProtese acao={conferirRetornoProtese} rotulo="Conferir retorno" {...ids}>
      <label>
        Ajuste necessário
        <input type="text" name="ajusteNecessario" />
      </label>
    </FormularioDaProtese>
  );
}

export function FormularioInstalacao({
  agendamentos,
  ...ids
}: Ids & { agendamentos: AgendamentoOpcao[] }) {
  return (
    <FormularioDaProtese acao={instalarProteseAcao} rotulo="Instalar prótese" {...ids}>
      <label>
        Comissão
        <input type="number" name="valorComissao" min="0" step="0.01" />
      </label>
      <label>
        Agendamento da instalação
        <select name="agendamentoInstalacaoId" defaultValue="">
          <option value="">Sem agendamento</option>
          {agendamentos.map((agendamento) => (
            <option key={agendamento.id} value={agendamento.id}>
              {`${dataAgendamento(agendamento.inicio)} · ${agendamento.status} · ${agendamento.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </label>
    </FormularioDaProtese>
  );
}

export function FormularioDescontinuar(ids: Ids) {
  return <FormularioDaProtese acao={descontinuarPedidoProtese} rotulo="Descontinuar pedido" {...ids} />;
}

export function FormularioLimite({ limite }: { limite: number }) {
  const { resposta, executar, pendente } = useFormulario(salvarLimiteAtraso);
  return (
    <>
      <Aviso key={resposta.quando} tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <label>
          Limite de atraso (dias)
          <input type="number" name="diasLimiteAtraso" min="1" step="1" defaultValue={limite} />
        </label>
        <button type="submit" disabled={pendente}>
          Salvar limite
        </button>
      </form>
    </>
  );
}
