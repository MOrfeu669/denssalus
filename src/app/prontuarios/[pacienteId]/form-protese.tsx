"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
    <Label className="flex-col items-stretch gap-1.5">
      {rotulo}
      <NativeSelect name={nome} defaultValue="">
        <NativeSelectOption value="">Nenhum</NativeSelectOption>
        {procedimentos.map((procedimento) => (
          <NativeSelectOption key={procedimento.id} value={procedimento.id}>
            {procedimento.nome}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Label>
  );
}

export function FormularioPedido({
  pacienteId,
  responsaveis,
  procedimentos,
  laboratorios = [],
}: {
  pacienteId: string;
  responsaveis: ResponsavelOpcao[];
  procedimentos: ProcedimentoOpcao[];
  laboratorios?: { id: string; nome: string }[];
}) {
  const { resposta, executar, pendente } = useFormulario(registrarPedidoProtese);
  return (
    <>
      <Aviso key={resposta.quando} tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <Label className="flex-col items-stretch gap-1.5">
          Tipo de prótese
          <Input type="text" name="tipo" required />
        </Label>
        <Label className="flex-col items-stretch gap-1.5">
          Dentes
          <Input type="text" name="dentes" placeholder="14 15 16" />
        </Label>
        <Label className="flex-col items-stretch gap-1.5">
          Responsável
          <NativeSelect name="responsavelId" defaultValue="" required>
            <NativeSelectOption value="">Selecione</NativeSelectOption>
            {responsaveis.map((responsavel) => (
              <NativeSelectOption key={responsavel.id} value={responsavel.id}>
                {responsavel.nome}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <Label className="flex-col items-stretch gap-1.5">
          Laboratório
          <NativeSelect name="laboratorioId" defaultValue="" required>
            <NativeSelectOption value="">Selecione</NativeSelectOption>
            {laboratorios.map((laboratorio) => (
              <NativeSelectOption key={laboratorio.id} value={laboratorio.id}>
                {laboratorio.nome}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
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
        <Button type="submit" disabled={pendente}>
          Registrar pedido
        </Button>
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
        <Button
          type="submit"
          variant={rotulo === "Descontinuar pedido" ? "destructive" : "default"}
          className={rotulo === "Descontinuar pedido" ? "prontuario-perigo" : undefined}
          disabled={pendente}
        >
          {rotulo}
        </Button>
      </form>
    </>
  );
}

type Ids = { pacienteId: string; proteseId: string };

export function FormularioEnvio(ids: Ids) {
  return (
    <FormularioDaProtese acao={registrarEnvioProtese} rotulo="Registrar envio" {...ids}>
      <Label className="flex-col items-stretch gap-1.5">
        Prazo de retorno
        <Input type="date" name="prazoRetorno" />
      </Label>
    </FormularioDaProtese>
  );
}

export function FormularioConferencia(ids: Ids) {
  return (
    <FormularioDaProtese acao={conferirRetornoProtese} rotulo="Conferir retorno" {...ids}>
      <Label className="flex-col items-stretch gap-1.5">
        Ajuste necessário
        <Input type="text" name="ajusteNecessario" />
      </Label>
    </FormularioDaProtese>
  );
}

export function FormularioInstalacao({
  agendamentos,
  ...ids
}: Ids & { agendamentos: AgendamentoOpcao[] }) {
  return (
    <FormularioDaProtese acao={instalarProteseAcao} rotulo="Instalar prótese" {...ids}>
      <Label className="flex-col items-stretch gap-1.5">
        Comissão
        <Input type="number" name="valorComissao" min="0" step="0.01" />
      </Label>
      <Label className="flex-col items-stretch gap-1.5">
        Agendamento da instalação
        <NativeSelect name="agendamentoInstalacaoId" defaultValue="">
          <NativeSelectOption value="">Sem agendamento</NativeSelectOption>
          {agendamentos.map((agendamento) => (
            <NativeSelectOption key={agendamento.id} value={agendamento.id}>
              {`${dataAgendamento(agendamento.inicio)} · ${agendamento.status} · ${agendamento.id.slice(0, 8)}`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Label>
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
        <Label className="flex-col items-stretch gap-1.5">
          Limite de atraso (dias)
          <Input type="number" name="diasLimiteAtraso" min="1" step="1" defaultValue={limite} />
        </Label>
        <Button type="submit" disabled={pendente}>
          Salvar limite
        </Button>
      </form>
    </>
  );
}
