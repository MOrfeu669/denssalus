import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO } from "../agendamento/tipos";
import { autorizarAcao } from "../auth/casos";
import { MENSAGEM_PAPEL, type Resultado, type Sessao } from "../auth/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO } from "../paciente/tipos";
import { MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO } from "../procedimento/tipos";
import type { Dependencias } from "./portas";
import { quadranteDe } from "./regras";
import {
  MENSAGEM_DENTE_INVALIDO,
  MENSAGEM_REGISTROS_CONFIRMADOS,
  type RegistroOdontograma,
} from "./tipos";

type Falha = { ok: false; mensagem: string };

async function pacienteDaClinica(
  deps: Dependencias,
  clinicaId: string,
  pacienteId: string,
): Promise<boolean> {
  const paciente = await deps.pacientes.buscarPorId(pacienteId);
  return paciente !== null && paciente.clinicaId === clinicaId;
}

async function procedimentoDaClinica(
  deps: Dependencias,
  clinicaId: string,
  procedimentoId: string,
): Promise<boolean> {
  const procedimento = await deps.procedimentos.buscarPorId(procedimentoId);
  return procedimento !== null && procedimento.clinicaId === clinicaId;
}

async function validarComum(
  deps: Dependencias,
  ator: Sessao,
  entrada: { pacienteId: string; dente: number; procedimentoId: string },
): Promise<Falha | null> {
  const permitido = autorizarAcao(ator, "odontograma:preencher");
  if (!permitido.ok) return permitido;
  if (quadranteDe(entrada.dente) === null) return { ok: false, mensagem: MENSAGEM_DENTE_INVALIDO };

  const clinicaId = ator.usuario.clinicaId;
  if (!(await pacienteDaClinica(deps, clinicaId, entrada.pacienteId))) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }
  if (!(await procedimentoDaClinica(deps, clinicaId, entrada.procedimentoId))) {
    return { ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO };
  }
  return null;
}

async function gravarNovo(
  deps: Dependencias,
  ator: Sessao,
  entrada: { pacienteId: string; dente: number; procedimentoId: string },
  vinculo: { origem: RegistroOdontograma["origem"]; agendamentoId: string | null },
  agora: Date,
): Promise<Resultado<RegistroOdontograma>> {
  const registro: RegistroOdontograma = {
    id: deps.ids.novo(),
    clinicaId: ator.usuario.clinicaId,
    pacienteId: entrada.pacienteId,
    dente: entrada.dente,
    quadrante: quadranteDe(entrada.dente) as RegistroOdontograma["quadrante"],
    procedimentoId: entrada.procedimentoId,
    origem: vinculo.origem,
    agendamentoId: vinculo.agendamentoId,
    status: "confirmado",
    registradoPor: ator.usuario.id,
    registradoEm: agora.toISOString(),
  };
  await deps.registros.salvar(registro);
  return { ok: true, valor: registro };
}

export async function registrarNoDente(
  deps: Dependencias,
  ator: Sessao,
  entrada: { pacienteId: string; dente: number; procedimentoId: string; agendamentoId: string },
  agora: Date,
): Promise<Resultado<RegistroOdontograma>> {
  const falha = await validarComum(deps, ator, entrada);
  if (falha) return falha;

  const agendamento = await deps.agendamentos.buscarPorId(entrada.agendamentoId);
  if (
    !agendamento ||
    agendamento.clinicaId !== ator.usuario.clinicaId ||
    agendamento.pacienteId !== entrada.pacienteId
  ) {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }
  return gravarNovo(
    deps,
    ator,
    entrada,
    { origem: "atendimento", agendamentoId: entrada.agendamentoId },
    agora,
  );
}

export async function registrarPreExistente(
  deps: Dependencias,
  ator: Sessao,
  entrada: { pacienteId: string; dente: number; procedimentoId: string },
  agora: Date,
): Promise<Resultado<RegistroOdontograma>> {
  const falha = await validarComum(deps, ator, entrada);
  if (falha) return falha;
  return gravarNovo(deps, ator, entrada, { origem: "pre_existente", agendamentoId: null }, agora);
}

export async function editarRegistro(
  deps: Dependencias,
  ator: Sessao,
  entrada: { registroId: string; procedimentoId: string },
  agora: Date,
): Promise<Resultado<RegistroOdontograma>> {
  const permitido = autorizarAcao(ator, "odontograma:preencher");
  if (!permitido.ok) return permitido;

  const clinicaId = ator.usuario.clinicaId;
  const anterior = await deps.registros.buscarPorId(entrada.registroId);
  if (!anterior || anterior.clinicaId !== clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }
  if (!(await procedimentoDaClinica(deps, clinicaId, entrada.procedimentoId))) {
    return { ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO };
  }

  const editado: RegistroOdontograma = { ...anterior, procedimentoId: entrada.procedimentoId };
  await deps.registros.salvar(editado);
  await deps.auditoria.registrar({
    id: deps.ids.novo(),
    clinicaId,
    entidade: "odontograma",
    entidadeId: anterior.id,
    usuarioId: ator.usuario.id,
    acao: "edicao",
    conteudoAnterior: JSON.stringify(anterior),
    registradoEm: agora.toISOString(),
  });
  return { ok: true, valor: editado };
}

async function lerDoPaciente(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Resultado<RegistroOdontograma[]>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };
  const clinicaId = ator.usuario.clinicaId;
  if (!(await pacienteDaClinica(deps, clinicaId, pacienteId))) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }
  const registros = await deps.registros.listarPorPaciente(clinicaId, pacienteId);
  return { ok: true, valor: registros.filter((item) => item.clinicaId === clinicaId) };
}

export async function historicoDoDente(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
  dente: number,
): Promise<Resultado<RegistroOdontograma[]>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };
  if (quadranteDe(dente) === null) return { ok: false, mensagem: MENSAGEM_DENTE_INVALIDO };

  const lidos = await lerDoPaciente(deps, ator, pacienteId);
  if (!lidos.ok) return lidos;
  const doDente = lidos.valor
    .filter((item) => item.dente === dente)
    .sort((a, b) => (a.registradoEm < b.registradoEm ? -1 : a.registradoEm > b.registradoEm ? 1 : 0));
  return { ok: true, valor: doDente };
}

export async function listarOdontograma(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Resultado<RegistroOdontograma[]>> {
  return lerDoPaciente(deps, ator, pacienteId);
}

export async function reverterDoAgendamento(
  deps: Dependencias,
  clinicaId: string,
  agendamentoId: string,
  confirmouReversao: boolean,
): Promise<Resultado<void>> {
  const registros = await deps.registros.listarPorAgendamento(clinicaId, agendamentoId);
  const confirmados = registros.filter(
    (item) => item.clinicaId === clinicaId && item.status === "confirmado",
  );
  if (confirmados.length === 0) return { ok: true, valor: undefined };
  if (!confirmouReversao) return { ok: false, mensagem: MENSAGEM_REGISTROS_CONFIRMADOS };

  for (const registro of confirmados) {
    await deps.registros.salvar({ ...registro, status: "revertido" });
  }
  return { ok: true, valor: undefined };
}
