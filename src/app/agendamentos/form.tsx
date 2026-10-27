"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { Papel } from "../../domain/auth/tipos";
import { sugerirFim } from "../../domain/agendamento/regras";
import type { Agendamento, OpcoesAgendamento } from "../../domain/agendamento/tipos";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { bloquear, cancelar, criar, iniciar } from "./actions";
import { FormularioCancelar, PerguntaReagendar, podeCancelar } from "./cancelar";

export type ValoresIniciais = {
  pacienteId: string;
  dentistaId: string;
  procedimentoId: string;
};

export function Agendamentos({
  agendamentos,
  opcoes,
  papel,
  usuarioId,
  inicial,
}: {
  agendamentos: Agendamento[];
  opcoes: OpcoesAgendamento;
  papel: Papel;
  usuarioId: string;
  inicial: ValoresIniciais;
}) {
  const roteador = useRouter();
  const [criacao, acaoCriar, pendenteCriar] = useActionState(criar, estadoVazio);
  const [atendimento, acaoIniciar, pendenteIniciar] = useActionState(iniciar, estadoVazio);
  const [bloqueio, acaoBloquear, pendenteBloquear] = useActionState(bloquear, estadoVazio);
  const [cancelamento, acaoCancelar, pendenteCancelar] = useActionState(cancelar, estadoVazio);
  const aviso = avisoVisivel(
    criacao,
    atendimento,
    bloqueio,
    ...(cancelamento.status === "erro" ? [cancelamento] : []),
  );
  const podeBloquear = papel === "admin" || papel === "dentista";

  useEffect(() => {
    if ([criacao, atendimento, bloqueio, cancelamento].some((item) => item.status === "sucesso")) {
      roteador.refresh();
    }
  }, [criacao, atendimento, bloqueio, cancelamento, roteador]);

  return (
    <>
      <Aviso tipo={aviso.status} mensagem={aviso.mensagem} />
      <PerguntaReagendar estado={cancelamento} agendamentos={agendamentos} />
      {agendamentos.length === 0 ? (
        <p>Nenhum agendamento nesta clínica.</p>
      ) : (
        <ul className="lista">
          {agendamentos.map((agendamento) => (
            <li key={agendamento.id}>
              <span>{resumo(agendamento, opcoes)}</span>
              {podeIniciar(agendamento, papel, usuarioId, opcoes.dentistas) ? (
                <form action={acaoIniciar} aria-busy={pendenteIniciar}>
                  <input type="hidden" name="id" value={agendamento.id} />
                  <button type="submit" disabled={pendenteIniciar}>
                    Iniciar atendimento
                  </button>
                </form>
              ) : null}
              {podeCancelar(agendamento) ? (
                <FormularioCancelar
                  id={agendamento.id}
                  acao={acaoCancelar}
                  pendente={pendenteCancelar}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form
        key={`${criacao.status === "sucesso" ? criacao.quando : 0}|${inicial.pacienteId}|${inicial.dentistaId}|${inicial.procedimentoId}`}
        action={acaoCriar}
        aria-busy={pendenteCriar}
      >
        <CamposCriar opcoes={opcoes} inicial={inicial} />
        <button type="submit" disabled={pendenteCriar}>
          Criar agendamento
        </button>
      </form>
      {podeBloquear ? (
        <form
          key={bloqueio.status === "sucesso" ? bloqueio.quando : 0}
          action={acaoBloquear}
          aria-busy={pendenteBloquear}
        >
          <DentistaDoBloqueio papel={papel} usuarioId={usuarioId} dentistas={opcoes.dentistas} />
          <label>
            Início
            <input name="inicio" type="datetime-local" required />
          </label>
          <label>
            Fim
            <input name="fim" type="datetime-local" required />
          </label>
          <label>
            Motivo
            <input name="motivo" />
          </label>
          <button type="submit" disabled={pendenteBloquear}>
            Bloquear agenda
          </button>
        </form>
      ) : null}
    </>
  );
}

function CamposCriar({
  opcoes,
  inicial,
}: {
  opcoes: OpcoesAgendamento;
  inicial: ValoresIniciais;
}) {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [procedimentoId, setProcedimentoId] = useState(inicial.procedimentoId);

  function aoEscolherProcedimento(valor: string) {
    setProcedimentoId(valor);
    const inicioLimpo = inicio.trim();
    if (!valor || !inicioLimpo) return;
    const procedimento = opcoes.procedimentos.find((item) => item.id === valor);
    if (!procedimento) return;
    setFim(sugerirFim(inicioLimpo, procedimento.tempoMedioMinutos));
  }

  return (
    <>
      <label>
        Paciente
        <select name="pacienteId" defaultValue={inicial.pacienteId} required>
          <option value="">Selecione</option>
          {opcoes.pacientes.map((paciente) => (
            <option key={paciente.id} value={paciente.id}>
              {paciente.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Dentista
        <select name="dentistaId" defaultValue={inicial.dentistaId} required>
          <option value="">Selecione</option>
          {opcoes.dentistas.map((dentista) => (
            <option key={dentista.id} value={dentista.id}>
              {dentista.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Cadeira
        <select name="cadeiraId" defaultValue="" required>
          <option value="">Selecione</option>
          {opcoes.cadeiras.map((cadeira) => (
            <option key={cadeira.id} value={cadeira.id}>
              {cadeira.identificacao}
            </option>
          ))}
        </select>
      </label>
      <label>
        Início
        <input
          name="inicio"
          type="datetime-local"
          value={inicio}
          onChange={(evento) => setInicio(evento.target.value)}
          required
        />
      </label>
      <label>
        Fim
        <input
          name="fim"
          type="datetime-local"
          value={fim}
          onChange={(evento) => setFim(evento.target.value)}
          required
        />
      </label>
      <label>
        Procedimento
        <select
          name="procedimentoId"
          value={procedimentoId}
          onChange={(evento) => aoEscolherProcedimento(evento.target.value)}
        >
          <option value="">Sem procedimento</option>
          {opcoes.procedimentos.map((procedimento) => (
            <option key={procedimento.id} value={procedimento.id}>
              {procedimento.nome}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function DentistaDoBloqueio({
  papel,
  usuarioId,
  dentistas,
}: {
  papel: Papel;
  usuarioId: string;
  dentistas: OpcoesAgendamento["dentistas"];
}) {
  if (papel === "admin") {
    return (
      <label>
        Dentista
        <select name="dentistaId" defaultValue="" required>
          <option value="">Selecione</option>
          {dentistas.map((dentista) => (
            <option key={dentista.id} value={dentista.id}>
              {dentista.nome}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const proprio = dentistas.find((dentista) => dentista.usuarioId === usuarioId);
  return <input type="hidden" name="dentistaId" value={proprio?.id ?? ""} />;
}

function podeIniciar(
  agendamento: Agendamento,
  papel: Papel,
  usuarioId: string,
  dentistas: OpcoesAgendamento["dentistas"],
): boolean {
  const aberto = agendamento.status === "agendado" || agendamento.status === "em_espera";
  if (!aberto) return false;
  if (papel === "admin") return true;
  return dentistas.some(
    (dentista) => dentista.id === agendamento.dentistaId && dentista.usuarioId === usuarioId,
  );
}

function resumo(agendamento: Agendamento, opcoes: OpcoesAgendamento): string {
  const paciente = opcoes.pacientes.find((item) => item.id === agendamento.pacienteId)?.nome;
  const dentista = opcoes.dentistas.find((item) => item.id === agendamento.dentistaId)?.nome;
  const cadeira = opcoes.cadeiras.find((item) => item.id === agendamento.cadeiraId)?.identificacao;
  const procedimento = agendamento.procedimentoId
    ? opcoes.procedimentos.find((item) => item.id === agendamento.procedimentoId)?.nome
    : null;
  const quando = `${agendamento.inicio}–${agendamento.fim}`;
  return [paciente, dentista, cadeira, procedimento, quando, agendamento.status]
    .filter((parte) => parte)
    .join(" · ");
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe
    ? `${escolhido.mensagem}: ${escolhido.detalhe}`
    : escolhido.mensagem;
  return { status: escolhido.status, mensagem };
}
