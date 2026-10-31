"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { Papel } from "../../domain/auth/tipos";
import { sugerirFim } from "../../domain/agendamento/regras";
import type { Agendamento, OpcoesAgendamento } from "../../domain/agendamento/tipos";
import { MENSAGEM_REGISTROS_CONFIRMADOS } from "../../domain/odontograma/tipos";
import { rotuloStatus } from "../agenda/rotulo";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { bloquear, cancelar, chegar, criar, emergencia, iniciar } from "./actions";
import { marcar } from "../retornos/actions";
import { registrarEvolucao } from "../prontuarios/[pacienteId]/actions";
import { FormularioMarcarRetorno } from "../retornos/form";
import { Alerta } from "./alerta";
import { FormularioCancelar, PerguntaReagendar, podeCancelar } from "./cancelar";
import { FormularioEvolucao, podeEvoluir } from "./evolucao";
import {
  intervaloLegivel,
  PENDENTE_BLOQUEAR,
  PENDENTE_CHEGADA,
  PENDENTE_CRIAR,
  PENDENTE_EMERGENCIA,
  PENDENTE_INICIAR,
  ROTULO_BLOQUEAR,
  ROTULO_CHEGADA,
  ROTULO_CRIAR,
  ROTULO_EMERGENCIA,
  ROTULO_INICIAR,
  rotuloDoBotao,
  VAZIO_AGENDAMENTOS,
} from "./texto";

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
  const [emergenciaEstado, acaoEmergencia, pendenteEmergencia] = useActionState(emergencia, estadoVazio);
  const [atendimento, acaoIniciar, pendenteIniciar] = useActionState(iniciar, estadoVazio);
  const [chegada, acaoChegar, pendenteChegar] = useActionState(chegar, estadoVazio);
  const [bloqueio, acaoBloquear, pendenteBloquear] = useActionState(bloquear, estadoVazio);
  const [cancelamento, acaoCancelar, pendenteCancelar] = useActionState(cancelar, estadoVazio);
  const [retorno, acaoRetorno, pendenteRetorno] = useActionState(marcar, estadoVazio);
  const [evolucao, acaoEvolucao, pendenteEvolucao] = useActionState(registrarEvolucao, estadoVazio);
  const aviso = avisoVisivel(
    criacao,
    emergenciaEstado,
    atendimento,
    chegada,
    bloqueio,
    retorno,
    evolucao,
    ...(cancelamento.status === "erro" && cancelamento.mensagem !== MENSAGEM_REGISTROS_CONFIRMADOS
      ? [{ ...cancelamento, detalhe: "" }]
      : []),
  );
  const podeBloquear = papel === "admin" || papel === "dentista";

  useEffect(() => {
    if (
      [criacao, emergenciaEstado, atendimento, chegada, bloqueio, cancelamento, retorno, evolucao].some(
        (item) => item.status === "sucesso",
      )
    ) {
      roteador.refresh();
    }
  }, [criacao, emergenciaEstado, atendimento, chegada, bloqueio, cancelamento, retorno, evolucao, roteador]);

  return (
    <div className="agendamentos-tela">
      <Alerta
        tipo={aviso.status === "sucesso" ? "sucesso" : "erro"}
        mensagem={aviso.mensagem}
        quando={aviso.quando}
        classe={`agendamentos-aviso agendamentos-aviso-${aviso.status === "sucesso" ? "sucesso" : "erro"}`}
      />
      <PerguntaReagendar estado={cancelamento} agendamentos={agendamentos} />

      <section className="agendamentos-bloco" aria-labelledby="agendamentos-novo">
        <h2 id="agendamentos-novo">Novo agendamento</h2>
        <form
          className="agendamentos-form"
          key={`${criacao.status === "sucesso" ? criacao.quando : 0}|${inicial.pacienteId}|${inicial.dentistaId}|${inicial.procedimentoId}`}
          action={acaoCriar}
          aria-busy={pendenteCriar || pendenteEmergencia}
        >
          <CamposCriar opcoes={opcoes} inicial={inicial} />
          <div className="agendamentos-botoes">
            <button type="submit" disabled={pendenteCriar || pendenteEmergencia}>
              {rotuloDoBotao(ROTULO_CRIAR, PENDENTE_CRIAR, pendenteCriar)}
            </button>
            <button
              type="submit"
              formAction={acaoEmergencia}
              disabled={pendenteCriar || pendenteEmergencia}
            >
              {rotuloDoBotao(ROTULO_EMERGENCIA, PENDENTE_EMERGENCIA, pendenteEmergencia)}
            </button>
          </div>
        </form>
      </section>

      {podeBloquear ? (
        <section className="agendamentos-bloco" aria-labelledby="agendamentos-bloqueio">
          <h2 id="agendamentos-bloqueio">Bloqueio de agenda</h2>
          <form
            className="agendamentos-form"
            key={bloqueio.status === "sucesso" ? bloqueio.quando : 0}
            action={acaoBloquear}
            aria-busy={pendenteBloquear}
          >
            <DentistaDoBloqueio papel={papel} usuarioId={usuarioId} dentistas={opcoes.dentistas} />
            <label className="agendamentos-campo">
              Início
              <input name="inicio" type="datetime-local" required />
            </label>
            <label className="agendamentos-campo">
              Fim
              <input name="fim" type="datetime-local" required />
            </label>
            <label className="agendamentos-campo">
              Motivo
              <input name="motivo" />
            </label>
            <div className="agendamentos-botoes">
              <button type="submit" disabled={pendenteBloquear}>
                {rotuloDoBotao(ROTULO_BLOQUEAR, PENDENTE_BLOQUEAR, pendenteBloquear)}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="agendamentos-bloco" aria-labelledby="agendamentos-lista">
        <h2 id="agendamentos-lista">Agendamentos da clínica</h2>
        {agendamentos.length === 0 ? (
          <p className="agendamentos-vazio">{VAZIO_AGENDAMENTOS}</p>
        ) : (
          <ul className="agendamentos-lista">
            {agendamentos.map((agendamento) => (
              <li id={agendamento.id} key={agendamento.id} className="agendamentos-item">
                <ResumoAgendamento agendamento={agendamento} opcoes={opcoes} />
                <div className="agendamentos-acoes">
                  {agendamento.status === "agendado" ? (
                    <form action={acaoChegar} aria-busy={pendenteChegar}>
                      <input type="hidden" name="id" value={agendamento.id} />
                      <button type="submit" disabled={pendenteChegar}>
                        {rotuloDoBotao(ROTULO_CHEGADA, PENDENTE_CHEGADA, pendenteChegar)}
                      </button>
                    </form>
                  ) : null}
                  {podeIniciar(agendamento, papel, usuarioId, opcoes.dentistas) ? (
                    <form action={acaoIniciar} aria-busy={pendenteIniciar}>
                      <input type="hidden" name="id" value={agendamento.id} />
                      <button type="submit" disabled={pendenteIniciar}>
                        {rotuloDoBotao(ROTULO_INICIAR, PENDENTE_INICIAR, pendenteIniciar)}
                      </button>
                    </form>
                  ) : null}
                  {podeCancelar(agendamento) ? (
                    <FormularioCancelar
                      id={agendamento.id}
                      acao={acaoCancelar}
                      pendente={pendenteCancelar}
                      estado={cancelamento}
                    />
                  ) : null}
                  {podeEvoluir(agendamento, papel, usuarioId, opcoes.dentistas) ? (
                    <FormularioEvolucao
                      agendamento={agendamento}
                      acao={acaoEvolucao}
                      pendente={pendenteEvolucao}
                    />
                  ) : null}
                  {agendamento.status === "concluido" && podeBloquear ? (
                    <FormularioMarcarRetorno
                      id={agendamento.id}
                      acao={acaoRetorno}
                      pendente={pendenteRetorno}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ResumoAgendamento({
  agendamento,
  opcoes,
}: {
  agendamento: Agendamento;
  opcoes: OpcoesAgendamento;
}) {
  const paciente = opcoes.pacientes.find((item) => item.id === agendamento.pacienteId)?.nome;
  const dentista = opcoes.dentistas.find((item) => item.id === agendamento.dentistaId)?.nome;
  const cadeira = opcoes.cadeiras.find((item) => item.id === agendamento.cadeiraId)?.identificacao;
  const procedimento = agendamento.procedimentoId
    ? opcoes.procedimentos.find((item) => item.id === agendamento.procedimentoId)?.nome
    : null;
  return (
    <div className="agendamentos-resumo">
      <p className="agendamentos-paciente">{paciente ?? "—"}</p>
      <span className={`agendamentos-status agendamentos-status-${agendamento.status}`}>
        {rotuloStatus(agendamento.status)}
      </span>
      <dl className="agendamentos-campos">
        <div>
          <dt>Dentista</dt>
          <dd>{dentista ?? "—"}</dd>
        </div>
        <div>
          <dt>Cadeira</dt>
          <dd>{cadeira ?? "—"}</dd>
        </div>
        <div>
          <dt>Intervalo</dt>
          <dd>{intervaloLegivel(agendamento.inicio, agendamento.fim)}</dd>
        </div>
        {procedimento ? (
          <div>
            <dt>Procedimento</dt>
            <dd>{procedimento}</dd>
          </div>
        ) : null}
      </dl>
    </div>
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
      <label className="agendamentos-campo">
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
      <label className="agendamentos-campo">
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
      <label className="agendamentos-campo">
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
      <label className="agendamentos-campo">
        Início
        <input
          name="inicio"
          type="datetime-local"
          value={inicio}
          onChange={(evento) => setInicio(evento.target.value)}
          required
        />
      </label>
      <label className="agendamentos-campo">
        Fim
        <input
          name="fim"
          type="datetime-local"
          value={fim}
          onChange={(evento) => setFim(evento.target.value)}
          required
        />
      </label>
      <label className="agendamentos-campo">
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
      <label className="agendamentos-campo">
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

// Uma mensagem por vez: a mais recente. `detalhe` guarda id para a tela, não texto para a pessoa.
function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  return { status: escolhido.status, mensagem: escolhido.mensagem, quando: escolhido.quando };
}
