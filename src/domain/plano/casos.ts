import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO } from "../agendamento/tipos";
import { autorizarAcao } from "../auth/casos";
import { MENSAGEM_PAPEL, type Resultado, type Sessao } from "../auth/tipos";
import { registrarNoDente } from "../odontograma/casos";
import type { Dependencias as DependenciasOdontograma } from "../odontograma/portas";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO } from "../paciente/tipos";
import { MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO } from "../procedimento/tipos";
import type { Dependencias } from "./portas";
import { mesmoConjunto, validarDentes, validarValor, valorTotal } from "./regras";
import {
  MENSAGEM_ITEM_CONCLUIDO,
  MENSAGEM_PLANO_CONCLUIDO,
  type EntradaItem,
  type ItemPlano,
  type PlanoComItens,
  type PlanoTratamento,
} from "./tipos";

type Falha = { ok: false; mensagem: string };

const STATUS_VINCULAVEIS = ["agendado", "em_espera", "iniciado"];

async function pacienteDaClinica(
  deps: Dependencias,
  clinicaId: string,
  pacienteId: string,
): Promise<boolean> {
  const paciente = await deps.pacientes.buscarPorId(pacienteId);
  return paciente !== null && paciente.clinicaId === clinicaId;
}

async function planoDaClinica(
  deps: Dependencias,
  clinicaId: string,
  planoId: string,
): Promise<PlanoTratamento | null> {
  const plano = await deps.planos.buscarPorId(planoId);
  return plano !== null && plano.clinicaId === clinicaId ? plano : null;
}

async function validarEntrada(
  deps: Dependencias,
  plano: PlanoTratamento,
  entrada: EntradaItem,
): Promise<Falha | null> {
  const erroDentes = validarDentes(entrada.dentes);
  if (erroDentes) return { ok: false, mensagem: erroDentes };
  const erroValor = validarValor(entrada.valor);
  if (erroValor) return { ok: false, mensagem: erroValor };

  const procedimento = await deps.procedimentos.buscarPorId(entrada.procedimentoId);
  if (!procedimento || procedimento.clinicaId !== plano.clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO };
  }
  if (entrada.agendamentoId === null) return null;

  const agendamento = await deps.agendamentos.buscarPorId(entrada.agendamentoId);
  if (
    !agendamento ||
    agendamento.clinicaId !== plano.clinicaId ||
    agendamento.pacienteId !== plano.pacienteId ||
    !STATUS_VINCULAVEIS.includes(agendamento.status)
  ) {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }
  return null;
}

export async function criarPlano(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
  agora: Date,
): Promise<Resultado<PlanoTratamento>> {
  const permitido = autorizarAcao(ator, "plano:editar");
  if (!permitido.ok) return permitido;

  const clinicaId = ator.usuario.clinicaId;
  if (!(await pacienteDaClinica(deps, clinicaId, pacienteId))) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }
  const plano: PlanoTratamento = {
    id: deps.ids.novo(),
    clinicaId,
    pacienteId,
    criadoPor: ator.usuario.id,
    status: "proposto",
    criadoEm: agora.toISOString(),
  };
  await deps.planos.salvar(plano);
  return { ok: true, valor: plano };
}

export async function adicionarItem(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaItem & { planoId: string },
  _agora: Date,
): Promise<Resultado<ItemPlano>> {
  const permitido = autorizarAcao(ator, "plano:editar");
  if (!permitido.ok) return permitido;

  const plano = await planoDaClinica(deps, ator.usuario.clinicaId, entrada.planoId);
  if (!plano) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  if (plano.status === "concluido") return { ok: false, mensagem: MENSAGEM_PLANO_CONCLUIDO };

  const falha = await validarEntrada(deps, plano, entrada);
  if (falha) return falha;

  const item: ItemPlano = {
    id: deps.ids.novo(),
    planoId: plano.id,
    procedimentoId: entrada.procedimentoId,
    dentes: [...entrada.dentes],
    valor: entrada.valor,
    agendamentoId: entrada.agendamentoId,
    status: "pendente",
    executadoPor: null,
    concluidoEm: null,
  };
  await deps.itens.salvar(item, plano.clinicaId);
  return { ok: true, valor: item };
}

export async function editarItem(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaItem & { itemId: string },
): Promise<Resultado<ItemPlano>> {
  const permitido = autorizarAcao(ator, "plano:editar");
  if (!permitido.ok) return permitido;

  const item = await deps.itens.buscarPorId(entrada.itemId);
  const plano = item ? await planoDaClinica(deps, ator.usuario.clinicaId, item.planoId) : null;
  if (!item || !plano) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  if (plano.status === "concluido") return { ok: false, mensagem: MENSAGEM_PLANO_CONCLUIDO };

  if (item.status === "concluido") {
    const igual =
      item.procedimentoId === entrada.procedimentoId &&
      item.valor === entrada.valor &&
      item.agendamentoId === entrada.agendamentoId &&
      mesmoConjunto(item.dentes, entrada.dentes);
    return igual ? { ok: true, valor: item } : { ok: false, mensagem: MENSAGEM_ITEM_CONCLUIDO };
  }

  const falha = await validarEntrada(deps, plano, entrada);
  if (falha) return falha;

  const editado: ItemPlano = {
    ...item,
    procedimentoId: entrada.procedimentoId,
    dentes: [...entrada.dentes],
    valor: entrada.valor,
    agendamentoId: entrada.agendamentoId,
  };
  await deps.itens.salvar(editado, plano.clinicaId);
  return { ok: true, valor: editado };
}

export async function marcarEmAndamento(
  deps: Dependencias,
  ator: Sessao,
  planoId: string,
): Promise<Resultado<PlanoTratamento>> {
  const permitido = autorizarAcao(ator, "plano:editar");
  if (!permitido.ok) return permitido;

  const plano = await planoDaClinica(deps, ator.usuario.clinicaId, planoId);
  if (!plano) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  if (plano.status === "concluido") return { ok: false, mensagem: MENSAGEM_PLANO_CONCLUIDO };
  if (plano.status === "em_andamento") return { ok: true, valor: plano };

  const andamento: PlanoTratamento = { ...plano, status: "em_andamento" };
  await deps.planos.salvar(andamento);
  return { ok: true, valor: andamento };
}

export async function listarPlanos(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Resultado<PlanoComItens[]>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };
  const clinicaId = ator.usuario.clinicaId;
  if (!(await pacienteDaClinica(deps, clinicaId, pacienteId))) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }
  const planos = await deps.planos.listarPorPaciente(clinicaId, pacienteId);
  const lista: PlanoComItens[] = [];
  for (const plano of planos.filter((item) => item.clinicaId === clinicaId)) {
    const itens = await deps.itens.listarPorPlano(plano.id);
    lista.push({ ...plano, itens, valorTotal: valorTotal(itens) });
  }
  return { ok: true, valor: lista };
}

async function fecharPlanosSemPendencia(deps: Dependencias, planos: PlanoTratamento[]) {
  for (const plano of planos) {
    if (plano.status === "concluido") continue;
    const itens = await deps.itens.listarPorPlano(plano.id);
    if (itens.some((item) => item.status === "pendente")) continue;
    await deps.planos.salvar({ ...plano, status: "concluido" });
  }
}

export async function concluirItensDoAgendamento(
  deps: Dependencias,
  clinicaId: string,
  agendamentoId: string,
  ator: Sessao,
  agora: Date,
): Promise<Resultado<void>> {
  const itens = await deps.itens.listarPorAgendamento(clinicaId, agendamentoId);
  const depsOdontograma: DependenciasOdontograma = {
    registros: deps.registros,
    auditoria: deps.auditoria,
    pacientes: deps.pacientes,
    procedimentos: deps.procedimentos,
    agendamentos: deps.agendamentos,
    ids: deps.ids,
  };
  const afetados = new Map<string, PlanoTratamento>();
  let falha: Falha | null = null;

  for (const item of itens) {
    const plano = await planoDaClinica(deps, clinicaId, item.planoId);
    if (!plano) continue;
    afetados.set(plano.id, plano);
    if (item.status !== "pendente") continue;

    for (const dente of item.dentes) {
      const registro = await registrarNoDente(
        depsOdontograma,
        ator,
        { pacienteId: plano.pacienteId, dente, procedimentoId: item.procedimentoId, agendamentoId },
        agora,
      );
      if (!registro.ok) {
        falha = registro;
        break;
      }
    }
    if (falha) break;

    await deps.itens.salvar(
      {
        ...item,
        status: "concluido",
        executadoPor: ator.usuario.id,
        concluidoEm: agora.toISOString(),
      },
      clinicaId,
    );
  }

  await fecharPlanosSemPendencia(deps, [...afetados.values()]);
  return falha ?? { ok: true, valor: undefined };
}
