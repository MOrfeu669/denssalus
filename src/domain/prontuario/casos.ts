import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO, type Agendamento } from "../agendamento/tipos";
import { autorizarAcao } from "../auth/casos";
import { MENSAGEM_PAPEL, type Resultado, type Sessao } from "../auth/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO, type Paciente } from "../paciente/tipos";
import type { Dependencias } from "./portas";
import {
  MENSAGEM_EVOLUCAO_NAO_INICIADA,
  MENSAGEM_EVOLUCAO_VAZIA,
  type Anamnese,
  type Evolucao,
  type ProntuarioAberto,
  type RegistroAuditoria,
} from "./tipos";

async function pacienteDaClinica(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Paciente | null> {
  const paciente = await deps.pacientes.buscarPorId(pacienteId);
  if (!paciente || paciente.clinicaId !== ator.usuario.clinicaId) return null;
  return paciente;
}

async function historicoDoPaciente(
  deps: Dependencias,
  clinicaId: string,
  pacienteId: string,
): Promise<Agendamento[]> {
  const todos = await deps.agendamentos.listar(clinicaId);
  return todos
    .filter((item) => item.clinicaId === clinicaId && item.pacienteId === pacienteId)
    .sort((a, b) => (a.inicio < b.inicio ? -1 : a.inicio > b.inicio ? 1 : 0));
}

export async function salvarAnamnese(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
  conteudo: string,
  agora: Date,
): Promise<Resultado<Anamnese>> {
  const permitido = autorizarAcao(ator, "anamnese:preencher");
  if (!permitido.ok) return permitido;

  const paciente = await pacienteDaClinica(deps, ator, pacienteId);
  if (!paciente) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };

  const instante = agora.toISOString();
  const anterior = await deps.anamneses.buscar(pacienteId);
  const anamnese: Anamnese = {
    pacienteId,
    conteudo: conteudo.trim(),
    preenchidoPor: ator.usuario.id,
    atualizadoEm: instante,
  };
  await deps.anamneses.salvar(anamnese);
  await deps.auditoria.registrar({
    id: deps.ids.novo(),
    clinicaId: paciente.clinicaId,
    entidade: "anamnese",
    entidadeId: pacienteId,
    usuarioId: ator.usuario.id,
    acao: anterior ? "edicao" : "criacao",
    conteudoAnterior: anterior ? anterior.conteudo : null,
    registradoEm: instante,
  });
  return { ok: true, valor: anamnese };
}

export async function salvarEvolucao(
  deps: Dependencias,
  ator: Sessao,
  agendamentoId: string,
  texto: string,
  agora: Date,
): Promise<Resultado<Evolucao>> {
  const permitido = autorizarAcao(ator, "evolucao:registrar");
  if (!permitido.ok) return permitido;

  const consulta = await deps.agendamentos.buscarPorId(agendamentoId);
  if (!consulta || consulta.clinicaId !== ator.usuario.clinicaId) {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }

  const conteudo = texto.trim();
  if (!conteudo) return { ok: false, mensagem: MENSAGEM_EVOLUCAO_VAZIA };

  const anterior = await deps.evolucoes.buscar(agendamentoId);
  if (!anterior && consulta.status !== "iniciado") {
    return { ok: false, mensagem: MENSAGEM_EVOLUCAO_NAO_INICIADA };
  }

  const instante = agora.toISOString();
  const evolucao: Evolucao = {
    agendamentoId,
    texto: conteudo,
    registradoPor: ator.usuario.id,
    registradoEm: instante,
  };
  await deps.evolucoes.salvar(evolucao);
  if (!anterior) {
    await deps.agendamentos.salvar({ ...consulta, status: "concluido", concluidoEm: instante });
    await deps.concluirItensDoAgendamento(consulta.clinicaId, agendamentoId, ator, agora);
  }
  await deps.auditoria.registrar({
    id: deps.ids.novo(),
    clinicaId: consulta.clinicaId,
    entidade: "evolucao",
    entidadeId: agendamentoId,
    usuarioId: ator.usuario.id,
    acao: anterior ? "edicao" : "criacao",
    conteudoAnterior: anterior ? anterior.texto : null,
    registradoEm: instante,
  });

  if (!anterior) {
    try {
      await deps.estoque.baixar(agendamentoId);
    } catch {
      // Estoque não bloqueia a conclusão; a regra da baixa insuficiente é da Feature 017.
    }
  }
  return { ok: true, valor: evolucao };
}

export async function abrirProntuario(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Resultado<ProntuarioAberto>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };

  const paciente = await pacienteDaClinica(deps, ator, pacienteId);
  if (!paciente) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };

  const historico = await historicoDoPaciente(deps, ator.usuario.clinicaId, pacienteId);
  const evolucoes = await deps.evolucoes.listar(historico.map((item) => item.id));
  const anamnese = await deps.anamneses.buscar(pacienteId);
  return { ok: true, valor: { paciente, anamnese, historico, evolucoes } };
}

export async function listarAuditoria(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Resultado<RegistroAuditoria[]>> {
  const permitido = autorizarAcao(ator, "auditoria:ler");
  if (!permitido.ok) return permitido;

  const paciente = await pacienteDaClinica(deps, ator, pacienteId);
  if (!paciente) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };

  const clinicaId = ator.usuario.clinicaId;
  const consultas = await historicoDoPaciente(deps, clinicaId, pacienteId);
  const idsConsultas = new Set(consultas.map((item) => item.id));
  const registros = await deps.auditoria.listar(clinicaId);
  const doPaciente = registros.filter(
    (registro) =>
      registro.clinicaId === clinicaId &&
      ((registro.entidade === "anamnese" && registro.entidadeId === pacienteId) ||
        (registro.entidade === "evolucao" && idsConsultas.has(registro.entidadeId))),
  );
  return { ok: true, valor: doPaciente };
}
