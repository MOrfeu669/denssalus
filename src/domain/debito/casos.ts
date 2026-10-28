import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO } from "../agendamento/tipos";
import { autorizarAcao } from "../auth/casos";
import type { Resultado, Sessao } from "../auth/tipos";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO } from "../paciente/tipos";
import type { Dependencias } from "./portas";
import {
  FORMAS_PAGAMENTO,
  MENSAGEM_DATA,
  MENSAGEM_DEBITO_NAO_ENCONTRADO,
  MENSAGEM_DESCONTO,
  MENSAGEM_FORMA,
  MENSAGEM_JA_QUITADO,
  type Debito,
  type DebitoComPagamento,
  type FormaPagamento,
  type Pagamento,
} from "./tipos";

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

async function debitoEmAberto(
  deps: Dependencias,
  ator: Sessao,
  debitoId: string,
): Promise<Resultado<Debito>> {
  const debito = await deps.debitos.buscarPorId(debitoId);
  if (!debito || debito.clinicaId !== ator.usuario.clinicaId) {
    return { ok: false, mensagem: MENSAGEM_DEBITO_NAO_ENCONTRADO };
  }
  if (debito.status === "quitado") return { ok: false, mensagem: MENSAGEM_JA_QUITADO };
  return { ok: true, valor: debito };
}

export async function gerarDebitosDoAtendimento(
  deps: Dependencias,
  ator: Sessao,
  agendamentoId: string,
): Promise<Resultado<Debito[]>> {
  const clinicaId = ator.usuario.clinicaId;
  const agendamento = await deps.agendamentos.buscarPorId(agendamentoId);
  if (!agendamento || agendamento.clinicaId !== clinicaId) {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }

  const existentes = await deps.debitos.listarPorAgendamento(clinicaId, agendamentoId);
  const itens = await deps.itens.listarPorAgendamento(clinicaId, agendamentoId);
  const novos: Debito[] = [];
  const base = {
    clinicaId,
    pacienteId: agendamento.pacienteId,
    agendamentoId,
    desconto: 0,
    descontoPor: null,
    status: "em_aberto" as const,
  };

  for (const item of itens) {
    if (existentes.some((d) => d.itemPlanoId === item.id)) continue;
    novos.push({
      ...base,
      id: deps.ids.novo(),
      origem: "item_plano",
      itemPlanoId: item.id,
      valor: item.valor,
    });
  }

  const jaTemAvulso = existentes.some((d) => d.origem === "procedimento_avulso");
  if (itens.length === 0 && agendamento.procedimentoId && !jaTemAvulso) {
    const procedimento = await deps.procedimentos.buscarPorId(agendamento.procedimentoId);
    if (procedimento) {
      novos.push({
        ...base,
        id: deps.ids.novo(),
        origem: "procedimento_avulso",
        itemPlanoId: null,
        valor: procedimento.valorMedio,
      });
    }
  }

  for (const debito of novos) await deps.debitos.salvar(debito);
  return { ok: true, valor: novos };
}

export async function listarDebitos(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
): Promise<Resultado<DebitoComPagamento[]>> {
  const permitido = autorizarAcao(ator, "debito:ver");
  if (!permitido.ok) return permitido;

  const paciente = await deps.pacientes.buscarPorId(pacienteId);
  if (!paciente || paciente.clinicaId !== ator.usuario.clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };
  }

  const clinicaId = ator.usuario.clinicaId;
  const debitos = (await deps.debitos.listarPorPaciente(clinicaId, pacienteId)).filter(
    (d) => d.clinicaId === clinicaId && d.pacienteId === pacienteId,
  );
  const pagamentos = await deps.pagamentos.listarPorDebitos(debitos.map((d) => d.id));
  return {
    ok: true,
    valor: debitos.map((d) => ({
      ...d,
      pagamento: pagamentos.find((p) => p.debitoId === d.id) ?? null,
    })),
  };
}

export async function aplicarDesconto(
  deps: Dependencias,
  ator: Sessao,
  debitoId: string,
  desconto: number,
): Promise<Resultado<Debito>> {
  const permitido = autorizarAcao(ator, "debito:descontar");
  if (!permitido.ok) return permitido;

  const aberto = await debitoEmAberto(deps, ator, debitoId);
  if (!aberto.ok) return aberto;
  const debito = aberto.valor;

  if (!Number.isFinite(desconto) || desconto < 0 || desconto > debito.valor) {
    return { ok: false, mensagem: MENSAGEM_DESCONTO };
  }

  const atualizado: Debito = {
    ...debito,
    desconto,
    descontoPor: ator.usuario.id,
    status: debito.valor - desconto === 0 ? "quitado" : "em_aberto",
  };
  await deps.debitos.salvar(atualizado);
  return { ok: true, valor: atualizado };
}

export async function quitarDebito(
  deps: Dependencias,
  ator: Sessao,
  debitoId: string,
  entrada: { forma: string; data: string },
): Promise<Resultado<{ debito: Debito; pagamento: Pagamento | null }>> {
  const permitido = autorizarAcao(ator, "debito:quitar");
  if (!permitido.ok) return permitido;

  const aberto = await debitoEmAberto(deps, ator, debitoId);
  if (!aberto.ok) return aberto;

  if (!(FORMAS_PAGAMENTO as readonly string[]).includes(entrada.forma)) {
    return { ok: false, mensagem: MENSAGEM_FORMA };
  }
  if (!FORMATO_DATA.test(entrada.data)) return { ok: false, mensagem: MENSAGEM_DATA };

  const pagamento: Pagamento = {
    id: deps.ids.novo(),
    debitoId,
    forma: entrada.forma as FormaPagamento,
    data: entrada.data,
    registradoPor: ator.usuario.id,
  };
  const debito: Debito = { ...aberto.valor, status: "quitado" };
  await deps.pagamentos.salvar(pagamento);
  await deps.debitos.salvar(debito);
  return { ok: true, valor: { debito, pagamento } };
}
