import { autorizarAcao } from "../auth/casos";
import type { Acao, Resultado, Sessao } from "../auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../clinica/tipos";
import type { Dependencias } from "./portas";
import { normalizarEntrada } from "./regras";
import {
  MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO,
  type EntradaProcedimento,
  type Procedimento,
} from "./tipos";

type Falha = { ok: false; mensagem: string };

async function clinicaDaSessao(
  deps: Dependencias,
  ator: Sessao,
  acao: Acao,
): Promise<{ ok: true; clinicaId: string } | Falha> {
  const permitido = autorizarAcao(ator, acao);
  if (!permitido.ok) return permitido;

  const clinica = await deps.clinicas.buscarPorId(ator.usuario.clinicaId);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };
  return { ok: true, clinicaId: clinica.id };
}

async function procedimentoDaClinica(
  deps: Dependencias,
  clinicaId: string,
  procedimentoId: string,
): Promise<{ ok: true; procedimento: Procedimento } | Falha> {
  const atual = await deps.procedimentos.buscarPorId(procedimentoId);
  if (!atual || atual.clinicaId !== clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO };
  }
  return { ok: true, procedimento: atual };
}

export async function criarProcedimento(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaProcedimento,
): Promise<Resultado<Procedimento>> {
  const contexto = await clinicaDaSessao(deps, ator, "procedimento:cadastrar");
  if (!contexto.ok) return contexto;

  const dados = normalizarEntrada(entrada);
  if (!dados.ok) return dados;

  const procedimento: Procedimento = {
    id: deps.ids.novo(),
    clinicaId: contexto.clinicaId,
    nome: dados.valor.nome,
    tempoMedioMinutos: dados.valor.tempoMedioMinutos,
    valorMedio: dados.valor.valorMedio,
  };
  await deps.procedimentos.salvar(procedimento);
  return { ok: true, valor: procedimento };
}

export async function editarProcedimento(
  deps: Dependencias,
  ator: Sessao,
  procedimentoId: string,
  entrada: EntradaProcedimento,
): Promise<Resultado<Procedimento>> {
  const contexto = await clinicaDaSessao(deps, ator, "procedimento:cadastrar");
  if (!contexto.ok) return contexto;

  const atual = await procedimentoDaClinica(deps, contexto.clinicaId, procedimentoId);
  if (!atual.ok) return atual;

  const dados = normalizarEntrada(entrada);
  if (!dados.ok) return dados;

  const editado: Procedimento = {
    id: atual.procedimento.id,
    clinicaId: atual.procedimento.clinicaId,
    nome: dados.valor.nome,
    tempoMedioMinutos: dados.valor.tempoMedioMinutos,
    valorMedio: dados.valor.valorMedio,
  };
  await deps.procedimentos.salvar(editado);
  return { ok: true, valor: editado };
}

export async function excluirProcedimento(
  deps: Dependencias,
  ator: Sessao,
  procedimentoId: string,
): Promise<Resultado<void>> {
  const contexto = await clinicaDaSessao(deps, ator, "procedimento:excluir");
  if (!contexto.ok) return contexto;

  const atual = await procedimentoDaClinica(deps, contexto.clinicaId, procedimentoId);
  if (!atual.ok) return atual;

  await deps.procedimentos.remover(atual.procedimento.id);
  return { ok: true, valor: undefined };
}

export async function listarProcedimentos(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<Procedimento[]>> {
  const contexto = await clinicaDaSessao(deps, ator, "procedimento:cadastrar");
  if (!contexto.ok) return contexto;

  const lista = await deps.procedimentos.listar(contexto.clinicaId);
  const ordenada = lista
    .filter((item) => item.clinicaId === contexto.clinicaId)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { ok: true, valor: ordenada };
}
