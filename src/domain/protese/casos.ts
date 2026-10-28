import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO } from "../agendamento/tipos";
import { autorizarAcao } from "../auth/casos";
import type { Resultado, Sessao } from "../auth/tipos";
import { MENSAGEM_DENTISTA_NAO_ENCONTRADO } from "../dentista/tipos";
import { quadranteDe } from "../odontograma/regras";
import { MENSAGEM_PACIENTE_NAO_ENCONTRADO } from "../paciente/tipos";
import { MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO } from "../procedimento/tipos";
import type { Dependencias } from "./portas";
import {
  estaAtrasada,
  normalizarPrazo,
  textoOuNulo,
  validarComissao,
  validarDentes,
  validarEtapa,
  validarLimite,
} from "./regras";
import {
  LIMITE_ATRASO_PADRAO,
  MENSAGEM_AJUSTE,
  MENSAGEM_ANDAMENTO,
  MENSAGEM_CONFERENCIA,
  MENSAGEM_DENTE_INVALIDO,
  MENSAGEM_INSTALACAO,
  MENSAGEM_LABORATORIO,
  MENSAGEM_PROTESE_NAO_ENCONTRADA,
  MENSAGEM_SAIDA,
  MENSAGEM_TIPO,
  type ConfigAtrasoProtese,
  type EntradaPedidoProtese,
  type EtapaProtese,
  type Protese,
} from "./tipos";

const naoEncontrada = { ok: false, mensagem: MENSAGEM_PROTESE_NAO_ENCONTRADA } as const;

async function pacienteDaClinica(deps: Dependencias, ator: Sessao, pacienteId: string) {
  const paciente = await deps.pacientes.buscarPorId(pacienteId);
  return paciente && paciente.clinicaId === ator.usuario.clinicaId ? paciente : null;
}

async function proteseDaClinica(deps: Dependencias, ator: Sessao, proteseId: string) {
  const protese = await deps.proteses.buscarPorId(proteseId);
  return protese && protese.clinicaId === ator.usuario.clinicaId ? protese : null;
}

async function limiteDaClinica(deps: Dependencias, clinicaId: string): Promise<number> {
  const config = await deps.configuracoes.buscar(clinicaId);
  return config && config.clinicaId === clinicaId ? config.diasLimiteAtraso : LIMITE_ATRASO_PADRAO;
}

async function procedimentoOpcional(
  deps: Dependencias,
  clinicaId: string,
  id: string | null | undefined,
): Promise<{ id: string | null } | { mensagem: string }> {
  if (id === null || id === undefined || id === "") return { id: null };
  const procedimento = await deps.procedimentos.buscarPorId(id);
  if (!procedimento || procedimento.clinicaId !== clinicaId) {
    return { mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO };
  }
  return { id };
}

function avancar(protese: Protese, etapa: EtapaProtese, ator: Sessao, agora: Date) {
  return {
    etapa,
    historico: [...protese.historico, { etapa, usuarioId: ator.usuario.id, em: agora.toISOString() }],
  };
}

export async function registrarPedido(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaPedidoProtese,
  agora: Date,
): Promise<Resultado<Protese>> {
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  const clinicaId = ator.usuario.clinicaId;

  const dentes = validarDentes(entrada.dentes);
  if ("mensagem" in dentes) return { ok: false, mensagem: dentes.mensagem };
  const tipo = entrada.tipo.trim();
  if (tipo === "") return { ok: false, mensagem: MENSAGEM_TIPO };
  const laboratorio = entrada.laboratorio.trim();
  if (laboratorio === "") return { ok: false, mensagem: MENSAGEM_LABORATORIO };

  const paciente = await pacienteDaClinica(deps, ator, entrada.pacienteId);
  if (!paciente) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };

  const responsavel = await deps.dentistas.buscarPorId(entrada.responsavelId);
  if (!responsavel || responsavel.clinicaId !== clinicaId || !responsavel.ativo) {
    return { ok: false, mensagem: MENSAGEM_DENTISTA_NAO_ENCONTRADO };
  }

  const avaliacao = await procedimentoOpcional(deps, clinicaId, entrada.procedimentoAvaliacaoId);
  if ("mensagem" in avaliacao) return { ok: false, mensagem: avaliacao.mensagem };
  const cirurgia = await procedimentoOpcional(deps, clinicaId, entrada.procedimentoCirurgiaId);
  if ("mensagem" in cirurgia) return { ok: false, mensagem: cirurgia.mensagem };

  const protese: Protese = {
    id: deps.ids.novo(),
    clinicaId,
    pacienteId: paciente.id,
    dentes: dentes.dentes,
    tipo,
    responsavelId: responsavel.id,
    laboratorio,
    procedimentoAvaliacaoId: avaliacao.id,
    procedimentoCirurgiaId: cirurgia.id,
    agendamentoInstalacaoId: null,
    etapa: "pre_envio",
    status: "em_andamento",
    prazoRetorno: null,
    ajusteNecessario: null,
    valorComissao: null,
    alertaAtraso: false,
    historico: [{ etapa: "pre_envio", usuarioId: ator.usuario.id, em: agora.toISOString() }],
  };
  await deps.proteses.salvar(protese);
  return { ok: true, valor: protese };
}

export async function registrarEnvio(
  deps: Dependencias,
  ator: Sessao,
  entrada: { proteseId: string; prazoRetorno: string },
  agora: Date,
): Promise<Resultado<Protese>> {
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  const atual = await proteseDaClinica(deps, ator, entrada.proteseId);
  if (!atual) return naoEncontrada;
  const fora = validarEtapa(atual, "pre_envio", MENSAGEM_SAIDA);
  if (fora) return { ok: false, mensagem: fora.mensagem };
  const prazo = normalizarPrazo(entrada.prazoRetorno);
  if ("mensagem" in prazo) return { ok: false, mensagem: prazo.mensagem };

  const protese: Protese = {
    ...atual,
    ...avancar(atual, "envio_acompanhamento", ator, agora),
    prazoRetorno: prazo.prazo,
  };
  await deps.proteses.salvar(protese);
  return { ok: true, valor: protese };
}

export async function conferirRetorno(
  deps: Dependencias,
  ator: Sessao,
  entrada: { proteseId: string; ajusteNecessario?: string | null },
  agora: Date,
): Promise<Resultado<Protese>> {
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  const atual = await proteseDaClinica(deps, ator, entrada.proteseId);
  if (!atual) return naoEncontrada;
  const fora = validarEtapa(atual, "envio_acompanhamento", MENSAGEM_CONFERENCIA);
  if (fora) return { ok: false, mensagem: fora.mensagem };

  const protese: Protese = {
    ...atual,
    ...avancar(atual, "recebimento_conferencia", ator, agora),
    ajusteNecessario: textoOuNulo(entrada.ajusteNecessario),
  };
  await deps.proteses.salvar(protese);
  return { ok: true, valor: protese };
}

export async function instalarProtese(
  deps: Dependencias,
  ator: Sessao,
  entrada: { proteseId: string; valorComissao: number; agendamentoInstalacaoId?: string | null },
  agora: Date,
): Promise<Resultado<Protese>> {
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  const atual = await proteseDaClinica(deps, ator, entrada.proteseId);
  if (!atual) return naoEncontrada;
  const fora = validarEtapa(atual, "recebimento_conferencia", MENSAGEM_INSTALACAO);
  if (fora) return { ok: false, mensagem: fora.mensagem };
  if (textoOuNulo(atual.ajusteNecessario) !== null) return { ok: false, mensagem: MENSAGEM_AJUSTE };
  const comissao = validarComissao(entrada.valorComissao);
  if (comissao) return { ok: false, mensagem: comissao.mensagem };

  const agendamentoId = entrada.agendamentoInstalacaoId || null;
  if (agendamentoId !== null) {
    const agendamento = await deps.agendamentos.buscarPorId(agendamentoId);
    if (
      !agendamento ||
      agendamento.clinicaId !== ator.usuario.clinicaId ||
      agendamento.pacienteId !== atual.pacienteId
    ) {
      return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
    }
  }

  const protese: Protese = {
    ...atual,
    ...avancar(atual, "instalacao", ator, agora),
    status: "concluida",
    valorComissao: entrada.valorComissao,
    agendamentoInstalacaoId: agendamentoId,
  };
  await deps.proteses.salvar(protese);
  return { ok: true, valor: protese };
}

export async function descontinuarProtese(
  deps: Dependencias,
  ator: Sessao,
  proteseId: string,
  agora: Date,
): Promise<Resultado<Protese>> {
  void agora;
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  const atual = await proteseDaClinica(deps, ator, proteseId);
  if (!atual) return naoEncontrada;
  if (atual.status !== "em_andamento") return { ok: false, mensagem: MENSAGEM_ANDAMENTO };

  const protese: Protese = { ...atual, status: "descontinuada" };
  await deps.proteses.salvar(protese);
  return { ok: true, valor: protese };
}

export async function configurarAtraso(
  deps: Dependencias,
  ator: Sessao,
  diasLimiteAtraso: number,
): Promise<Resultado<ConfigAtrasoProtese>> {
  const permitido = autorizarAcao(ator, "clinica:configurar");
  if (!permitido.ok) return permitido;
  const invalido = validarLimite(diasLimiteAtraso);
  if (invalido) return { ok: false, mensagem: invalido.mensagem };

  const config = { clinicaId: ator.usuario.clinicaId, diasLimiteAtraso };
  await deps.configuracoes.salvar(config);
  return { ok: true, valor: config };
}

export async function obterLimiteAtraso(deps: Dependencias, ator: Sessao): Promise<Resultado<number>> {
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  return { ok: true, valor: await limiteDaClinica(deps, ator.usuario.clinicaId) };
}

export async function listarResponsaveis(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<{ id: string; nome: string }[]>> {
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  const clinicaId = ator.usuario.clinicaId;
  const dentistas = await deps.dentistas.listar(clinicaId);
  return {
    ok: true,
    valor: dentistas.filter((d) => d.clinicaId === clinicaId && d.ativo).map((d) => ({ id: d.id, nome: d.nome })),
  };
}

// Não há cron: a listagem liga o alerta e cria o aviso das peças atrasadas.
async function verificarAtraso(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
  agora: Date,
): Promise<Resultado<Protese[]>> {
  const clinicaId = ator.usuario.clinicaId;
  const paciente = await pacienteDaClinica(deps, ator, pacienteId);
  if (!paciente) return { ok: false, mensagem: MENSAGEM_PACIENTE_NAO_ENCONTRADO };

  const limite = await limiteDaClinica(deps, clinicaId);
  const doPaciente = (await deps.proteses.listarPorPaciente(clinicaId, pacienteId)).filter(
    (p) => p.clinicaId === clinicaId && p.pacienteId === pacienteId,
  );

  const resultado: Protese[] = [];
  for (const protese of doPaciente) {
    if (!estaAtrasada(protese, limite, agora)) {
      resultado.push(protese);
      continue;
    }
    const atualizada = protese.alertaAtraso ? protese : { ...protese, alertaAtraso: true };
    if (!protese.alertaAtraso) await deps.proteses.salvar(atualizada);
    if (!(await deps.avisos.buscarPorProtese(protese.id))) {
      await deps.avisos.salvar({
        id: deps.ids.novo(),
        clinicaId,
        proteseId: protese.id,
        tipo: "atraso_protese",
        criadoEm: agora.toISOString(),
      });
    }
    resultado.push(atualizada);
  }
  return { ok: true, valor: resultado };
}

export async function listarProteses(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
  agora: Date,
): Promise<Resultado<Protese[]>> {
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  return verificarAtraso(deps, ator, pacienteId, agora);
}

export async function listarPorDente(
  deps: Dependencias,
  ator: Sessao,
  pacienteId: string,
  dente: number,
  agora: Date,
): Promise<Resultado<Protese[]>> {
  const permitido = autorizarAcao(ator, "protese:gerir");
  if (!permitido.ok) return permitido;
  if (quadranteDe(dente) === null) return { ok: false, mensagem: MENSAGEM_DENTE_INVALIDO };
  const lista = await verificarAtraso(deps, ator, pacienteId, agora);
  if (!lista.ok) return lista;
  return { ok: true, valor: lista.valor.filter((p) => p.dentes.includes(dente)) };
}
