"use client";

import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
import type { ItemPlano, PlanoComItens, StatusPlano } from "../../../domain/plano/tipos";
import {
  FormularioAdicionarItem,
  FormularioCriarPlano,
  FormularioEditarItem,
  FormularioEmAndamento,
} from "./form-plano";
import { dataAgendamento } from "./formato";
import type { AgendamentoOpcao, ProcedimentoOpcao } from "./tipos-odontograma";

const STATUS_PLANO: Record<StatusPlano, string> = {
  proposto: "proposto",
  em_andamento: "em andamento",
  concluido: "concluído",
};

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Item({
  item,
  pacienteId,
  procedimentos,
  agendamentos,
  podeEscrever,
}: {
  item: ItemPlano;
  pacienteId: string;
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
  podeEscrever: boolean;
}) {
  const nome = procedimentos.find((opcao) => opcao.id === item.procedimentoId)?.nome;
  const marcado = agendamentos.find((opcao) => opcao.id === item.agendamentoId);
  const partes = [
    nome ?? item.procedimentoId,
    `Dentes ${item.dentes.join(", ")}`,
    moeda(item.valor),
    item.status,
  ];
  if (item.agendamentoId) {
    partes.push(
      `Agendamento ${marcado ? dataAgendamento(marcado.inicio) : item.agendamentoId.slice(0, 8)}`,
    );
  }
  return (
    <li>
      <span>{partes.join(" · ")}</span>
      {podeEscrever && item.status === "pendente" ? (
        <FormularioEditarItem
          pacienteId={pacienteId}
          item={item}
          procedimentos={procedimentos}
          agendamentos={agendamentos}
        />
      ) : null}
    </li>
  );
}

function Plano({
  plano,
  pacienteId,
  procedimentos,
  agendamentos,
  podeEscrever,
}: {
  plano: PlanoComItens;
  pacienteId: string;
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
  podeEscrever: boolean;
}) {
  const editavel = podeEscrever && plano.status !== "concluido";
  return (
    <li>
      <h3>{`Plano ${STATUS_PLANO[plano.status]}`}</h3>
      <p>Valor total: {moeda(plano.valorTotal)}</p>
      {plano.itens.length === 0 ? (
        <p>Nenhum item neste plano.</p>
      ) : (
        <ul className="lista">
          {plano.itens.map((item) => (
            <Item
              key={item.id}
              item={item}
              pacienteId={pacienteId}
              procedimentos={procedimentos}
              agendamentos={agendamentos}
              podeEscrever={editavel}
            />
          ))}
        </ul>
      )}
      {editavel ? (
        <>
          <FormularioAdicionarItem
            pacienteId={pacienteId}
            planoId={plano.id}
            procedimentos={procedimentos}
            agendamentos={agendamentos}
          />
          {plano.status === "proposto" ? (
            <FormularioEmAndamento pacienteId={pacienteId} planoId={plano.id} />
          ) : null}
        </>
      ) : null}
    </li>
  );
}

export function SecaoPlano({
  pacienteId,
  planos,
  procedimentos,
  agendamentos,
  podeEscrever,
}: {
  pacienteId: string;
  planos: PlanoComItens[];
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
  podeEscrever: boolean;
}) {
  return (
    <>
      {podeEscrever ? <FormularioCriarPlano pacienteId={pacienteId} /> : null}
      {planos.length === 0 ? <p>Nenhum plano de tratamento.</p> : null}
      <ul className="lista">
        {planos.map((plano) => (
          <Plano
            key={plano.id}
            plano={plano}
            pacienteId={pacienteId}
            procedimentos={procedimentos}
            agendamentos={agendamentos}
            podeEscrever={podeEscrever}
          />
        ))}
      </ul>
      {podeEscrever ? null : <p>{MENSAGEM_PAPEL}</p>}
    </>
  );
}
