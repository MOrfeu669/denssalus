import Link from "next/link";
import type { Agendamento } from "../../../domain/agendamento/tipos";
import type { Paciente } from "../../../domain/paciente/tipos";
import { idadeEm } from "../../../domain/paciente/regras";
import type { RegistroAuditoria } from "../../../domain/prontuario/tipos";
import { rotuloStatus } from "../../agenda/rotulo";
import { dataAgendamento, dataNascimento, instante } from "./formato";

const ROTULO_CANAL = { sms: "SMS", email: "E-mail", whatsapp: "WhatsApp" } as const;

export function VisaoGeral({ paciente }: { paciente: Paciente }) {
  const canais = paciente.canais.map(
    (item) => `${ROTULO_CANAL[item.canal]} ${item.contato}${item.preferido ? " (preferido)" : ""}`,
  );
  return (
    <section className="prontuario-secao" aria-labelledby="visao-geral">
      <h2 id="visao-geral">Visão geral</h2>
      <ul className="lista">
        <li>Nome: {paciente.nome}</li>
        <li>Canais: {canais.join(", ") || "Não informado"}</li>
        <li>CPF: {paciente.cpf ?? "Não informado"}</li>
        <li>Endereço: {paciente.endereco ?? "Não informado"}</li>
        <li>
          Data de nascimento:{" "}
          {paciente.dataNascimento ? dataNascimento(paciente.dataNascimento) : "Não informado"}
        </li>
        {paciente.dataNascimento ? (
          <li>Idade: {idadeEm(paciente.dataNascimento, new Date())} anos</li>
        ) : null}
        <li>Sexo: {paciente.sexo ?? "Não informado"}</li>
        {paciente.responsavel ? (
          <li>
            Responsável: {paciente.responsavel.nome} · CPF {paciente.responsavel.cpf}
            {paciente.responsavel.telefone ? ` · ${paciente.responsavel.telefone}` : ""}
          </li>
        ) : null}
      </ul>
      <p className="nav">
        <Link href="/pacientes">Editar a visão geral em Pacientes</Link>
      </p>
    </section>
  );
}

export function Historico({ historico }: { historico: Agendamento[] }) {
  return (
    <section className="prontuario-secao" aria-labelledby="historico">
      <h2 id="historico">Histórico</h2>
      {historico.length === 0 ? (
        <p>Nenhum agendamento para este paciente.</p>
      ) : (
        <ul className="lista">
          {historico.map((agendamento) => (
            <li
              key={agendamento.id}
              className={agendamento.status === "cancelado" ? "riscado" : undefined}
            >
              {dataAgendamento(agendamento.inicio)} · {rotuloStatus(agendamento.status)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Auditoria({ registros }: { registros: RegistroAuditoria[] }) {
  return (
    <section className="prontuario-secao" aria-labelledby="auditoria">
      <h2 id="auditoria">Trilha de auditoria</h2>
      {registros.length === 0 ? (
        <p>Nenhum registro na trilha.</p>
      ) : (
        <ul className="lista">
          {registros.map((registro) => (
            <li key={registro.id}>
              {registro.entidade} · {registro.acao} · autor {registro.usuarioId} ·{" "}
              {instante(registro.registradoEm)} · anterior:{" "}
              {registro.conteudoAnterior ?? "sem conteúdo anterior"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
