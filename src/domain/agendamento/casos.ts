import { autorizarAcao } from "../auth/casos";
import { MENSAGEM_PAPEL, type Acao, type Resultado, type Sessao } from "../auth/tipos";
import type { Cadeira, Clinica } from "../clinica/tipos";
import { MENSAGEM_CADEIRA_NAO_ENCONTRADA, MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../clinica/tipos";
import type { Dentista } from "../dentista/tipos";
import { MENSAGEM_DENTISTA_NAO_ENCONTRADO } from "../dentista/tipos";
import { publicar, publicarPorRegra } from "../notificacao/casos";
import { MENSAGEM_CANCELAMENTO_COMUNICAR, MENSAGEM_PACIENTE_AGUARDANDO } from "../notificacao/regras";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO } from "../paciente/tipos";
import { MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO } from "../procedimento/tipos";
import type { Dependencias } from "./portas";
import { horarioValido, mensagemDeConflito, mensagemDosSetePassos } from "./regras";
import {
  MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO,
  MENSAGEM_HORARIO_INVALIDO,
  MENSAGEM_JA_CONCLUIDO,
  MENSAGEM_MOTIVO_OBRIGATORIO,
  type Agendamento,
  type BloqueioAgenda,
  type EntradaAgendamento,
  type EntradaBloqueio,
  type OpcoesAgendamento,
} from "./tipos";

export { verAgenda } from "./agenda";

type Falha = { ok: false; mensagem: string };
type ClinicaOk = { ok: true; clinica: Clinica };
type Entidades = { ok: true; cadeira: Cadeira; dentista: Dentista };

async function buscarClinica(deps: Dependencias, clinicaId: string): Promise<ClinicaOk | Falha> {
  const clinica = await deps.clinicas.buscarPorId(clinicaId);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };
  return { ok: true, clinica };
}

async function clinicaAutorizada(
  deps: Dependencias,
  ator: Sessao,
  acao: Acao,
): Promise<ClinicaOk | Falha> {
  const permitido = autorizarAcao(ator, acao);
  if (!permitido.ok) return permitido;
  return buscarClinica(deps, ator.usuario.clinicaId);
}

async function validarEntidades(
  deps: Dependencias,
  clinicaId: string,
  entrada: EntradaAgendamento,
): Promise<Entidades | Falha> {
  if (!horarioValido(entrada.inicio, entrada.fim)) {
    return { ok: false, mensagem: MENSAGEM_HORARIO_INVALIDO };
  }

  const paciente = await deps.pacientes.buscarPorId(entrada.pacienteId);
  if (!paciente || paciente.clinicaId !== clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }

  const dentista = await deps.dentistas.buscarPorId(entrada.dentistaId);
  if (!dentista || dentista.clinicaId !== clinicaId) {
    return { ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO };
  }

  const cadeiras = await deps.cadeiras.listar(clinicaId);
  const cadeira = cadeiras.find((item) => item.id === entrada.cadeiraId);
  if (!cadeira) return { ok: false, mensagem: MENSAGEM_CADEIRA_NAO_ENCONTRADA };

  if (entrada.procedimentoId !== null) {
    const procedimento = await deps.procedimentos.buscarPorId(entrada.procedimentoId);
    if (!procedimento || procedimento.clinicaId !== clinicaId) {
      return { ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO };
    }
  }

  return { ok: true, cadeira, dentista };
}

async function gravar(
  deps: Dependencias,
  ator: Sessao,
  clinicaId: string,
  entrada: EntradaAgendamento,
  emergencia: boolean,
): Promise<Resultado<Agendamento>> {
  const agendamento: Agendamento = {
    id: deps.ids.novo(),
    clinicaId,
    pacienteId: entrada.pacienteId,
    dentistaId: entrada.dentistaId,
    cadeiraId: entrada.cadeiraId,
    procedimentoId: entrada.procedimentoId,
    inicio: entrada.inicio,
    fim: entrada.fim,
    status: "agendado",
    iniciadoPor: null,
    emergencia,
    criadoPor: ator.usuario.id,
    alertaCadeira: false,
    alertaHorario: false,
    alertaDentista: false,
    motivoCancelamento: null,
    canceladoPor: null,
    canceladoEm: null,
    concluidoEm: null,
  };
  const conflito = await deps.agendamentos.salvar(agendamento);
  if (conflito) return { ok: false, mensagem: mensagemDeConflito(conflito) };
  return { ok: true, valor: agendamento };
}

async function notificarCriado(deps: Dependencias, agendamento: Agendamento): Promise<void> {
  try {
    await deps.notificarAgendamentoCriado(agendamento, new Date());
  } catch {
    return;
  }
}

export async function criarAgendamento(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaAgendamento,
): Promise<Resultado<Agendamento>> {
  const contexto = await clinicaAutorizada(deps, ator, "agendamento:criar");
  if (!contexto.ok) return contexto;

  const entidades = await validarEntidades(deps, contexto.clinica.id, entrada);
  if (!entidades.ok) return entidades;

  const [agendamentos, bloqueios] = await Promise.all([
    deps.agendamentos.listar(contexto.clinica.id),
    deps.bloqueios.listar(contexto.clinica.id),
  ]);
  const mensagem = mensagemDosSetePassos(
    contexto.clinica,
    entidades.cadeira,
    entidades.dentista,
    entrada,
    agendamentos,
    bloqueios,
  );
  if (mensagem) return { ok: false, mensagem };

  const gravado = await gravar(deps, ator, contexto.clinica.id, entrada, false);
  if (gravado.ok) {
    await deps.retornos.concluirPendentes(gravado.valor.clinicaId, gravado.valor.pacienteId);
    await notificarCriado(deps, gravado.valor);
  }
  return gravado;
}

export async function registrarEmergencia(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaAgendamento,
): Promise<Resultado<Agendamento>> {
  const contexto = await buscarClinica(deps, ator.usuario.clinicaId);
  if (!contexto.ok) return contexto;

  const entidades = await validarEntidades(deps, contexto.clinica.id, entrada);
  if (!entidades.ok) return entidades;

  const gravado = await gravar(deps, ator, contexto.clinica.id, entrada, true);
  if (gravado.ok) await notificarCriado(deps, gravado.valor);
  return gravado;
}

export async function iniciarAtendimento(
  deps: Dependencias,
  ator: Sessao,
  agendamentoId: string,
): Promise<Resultado<Agendamento>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };

  const atual = await deps.agendamentos.buscarPorId(agendamentoId);
  const podeIniciar = atual?.status === "agendado" || atual?.status === "em_espera";
  if (!atual || atual.clinicaId !== ator.usuario.clinicaId || !podeIniciar) {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }

  if (ator.usuario.papel !== "admin") {
    const dentista = await deps.dentistas.buscarPorId(atual.dentistaId);
    const responsavel = ator.usuario.papel === "dentista" && dentista?.usuarioId === ator.usuario.id;
    if (!responsavel) return { ok: false, mensagem: MENSAGEM_PAPEL };
  }

  const iniciado: Agendamento = {
    ...atual,
    status: "iniciado",
    iniciadoPor: ator.usuario.id,
  };
  const conflito = await deps.agendamentos.salvar(iniciado);
  if (conflito) return { ok: false, mensagem: mensagemDeConflito(conflito) };
  return { ok: true, valor: iniciado };
}

export async function cancelarAgendamento(
  deps: Dependencias,
  ator: Sessao,
  agendamentoId: string,
  motivo: string,
  agora: Date,
  confirmouReversao: boolean,
): Promise<Resultado<Agendamento>> {
  const contexto = await clinicaAutorizada(deps, ator, "agendamento:cancelar");
  if (!contexto.ok) return contexto;

  const motivoLimpo = motivo.trim();
  if (motivoLimpo === "") return { ok: false, mensagem: MENSAGEM_MOTIVO_OBRIGATORIO };

  const atual = await deps.agendamentos.buscarPorId(agendamentoId);
  if (!atual || atual.clinicaId !== contexto.clinica.id || atual.status === "cancelado") {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }
  if (atual.status === "concluido") return { ok: false, mensagem: MENSAGEM_JA_CONCLUIDO };

  const reversao = await deps.reverterDoAgendamento(atual.clinicaId, atual.id, confirmouReversao);
  if (!reversao.ok) return reversao;

  const cancelado: Agendamento = {
    ...atual,
    status: "cancelado",
    motivoCancelamento: motivoLimpo,
    canceladoPor: ator.usuario.id,
    canceladoEm: agora.toISOString(),
  };
  const conflito = await deps.agendamentos.salvar(cancelado);
  if (conflito) return { ok: false, mensagem: mensagemDeConflito(conflito) };

  await deps.avisos.avisarRecepcionista({
    clinicaId: cancelado.clinicaId,
    agendamentoId: cancelado.id,
    pacienteId: cancelado.pacienteId,
    motivo: motivoLimpo,
  });
  await publicarPorRegra(deps.notificacoes, {
    clinicaId: cancelado.clinicaId,
    tipo: "cancelamento_comunicar",
    referenciaId: cancelado.id,
    mensagem: MENSAGEM_CANCELAMENTO_COMUNICAR,
  });
  return { ok: true, valor: cancelado };
}

export async function marcarChegada(
  deps: Dependencias,
  ator: Sessao,
  agendamentoId: string,
): Promise<Resultado<Agendamento>> {
  const permitido = autorizarAcao(ator, "agendamento:criar");
  if (!permitido.ok) return permitido;

  const atual = await deps.agendamentos.buscarPorId(agendamentoId);
  if (!atual || atual.clinicaId !== ator.usuario.clinicaId || atual.status !== "agendado") {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }

  const aguardando: Agendamento = { ...atual, status: "em_espera" };
  const conflito = await deps.agendamentos.salvar(aguardando);
  if (conflito) return { ok: false, mensagem: mensagemDeConflito(conflito) };

  const dentista = await deps.dentistas.buscarPorId(atual.dentistaId);
  if (dentista) {
    await publicar(deps.notificacoes, {
      clinicaId: atual.clinicaId,
      tipo: "paciente_aguardando",
      referenciaId: atual.id,
      mensagem: MENSAGEM_PACIENTE_AGUARDANDO,
      destinatarioIds: [dentista.usuarioId],
    });
  }
  return { ok: true, valor: aguardando };
}

export async function criarBloqueio(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaBloqueio,
): Promise<Resultado<BloqueioAgenda>> {
  const contexto = await clinicaAutorizada(deps, ator, "agendamento:bloquear");
  if (!contexto.ok) return contexto;

  if (!horarioValido(entrada.inicio, entrada.fim)) {
    return { ok: false, mensagem: MENSAGEM_HORARIO_INVALIDO };
  }

  const dentista = await deps.dentistas.buscarPorId(entrada.dentistaId);
  if (!dentista || dentista.clinicaId !== contexto.clinica.id) {
    return { ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO };
  }
  if (ator.usuario.papel === "dentista" && dentista.usuarioId !== ator.usuario.id) {
    return { ok: false, mensagem: MENSAGEM_PAPEL };
  }

  const bloqueio: BloqueioAgenda = {
    id: deps.ids.novo(),
    clinicaId: contexto.clinica.id,
    dentistaId: entrada.dentistaId,
    inicio: entrada.inicio,
    fim: entrada.fim,
    motivo: entrada.motivo,
    criadoPor: ator.usuario.id,
  };
  await deps.bloqueios.salvar(bloqueio);
  return { ok: true, valor: bloqueio };
}

export async function listarAgendamentos(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<Agendamento[]>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };
  const contexto = await buscarClinica(deps, ator.usuario.clinicaId);
  if (!contexto.ok) return contexto;
  return { ok: true, valor: await deps.agendamentos.listar(contexto.clinica.id) };
}

export async function listarOpcoesAgendamento(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<OpcoesAgendamento>> {
  const contexto = await clinicaAutorizada(deps, ator, "agendamento:criar");
  if (!contexto.ok) return contexto;
  const clinicaId = contexto.clinica.id;

  const [pacientes, dentistas, cadeiras, procedimentos] = await Promise.all([
    deps.pacientes.listar(clinicaId),
    deps.dentistas.listar(clinicaId),
    deps.cadeiras.listar(clinicaId),
    deps.procedimentos.listar(clinicaId),
  ]);
  const porNome = <T extends { nome: string }>(itens: T[]): T[] =>
    [...itens].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return {
    ok: true,
    valor: {
      pacientes: porNome(pacientes.map((item) => ({ id: item.id, nome: item.nome }))),
      dentistas: porNome(
        dentistas.map((item) => ({ id: item.id, nome: item.nome, usuarioId: item.usuarioId })),
      ),
      cadeiras: cadeiras
        .map((item) => ({ id: item.id, identificacao: item.identificacao }))
        .sort((a, b) => a.identificacao.localeCompare(b.identificacao, "pt-BR")),
      procedimentos: porNome(
        procedimentos.map((item) => ({
          id: item.id,
          nome: item.nome,
          tempoMedioMinutos: item.tempoMedioMinutos,
        })),
      ),
    },
  };
}
