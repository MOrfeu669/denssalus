import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO } from "../agendamento/tipos";
import { autorizarAcao } from "../auth/casos";
import { MENSAGEM_PAPEL, type Resultado, type Sessao } from "../auth/tipos";
import { publicarPorRegra, resolver } from "../notificacao/casos";
import type { Dependencias } from "./portas";
import { dataFutura, dentroDoPrazo } from "./regras";
import {
  MENSAGEM_DATA_FUTURA,
  MENSAGEM_JA_TEM_RETORNO,
  MENSAGEM_PRAZO,
  MENSAGEM_RETORNO_IMUTAVEL,
  PRAZO_PADRAO,
  textoAvisoRetorno,
  type ConfiguracaoRetorno,
  type EntradaMarcarRetorno,
  type Retorno,
  type RetornoVisivel,
} from "./tipos";

export async function obterPrazo(deps: Dependencias, clinicaId: string): Promise<number> {
  const config = await deps.configuracoes.buscar(clinicaId);
  return config?.diasAntecedencia ?? PRAZO_PADRAO;
}

export async function marcarRetorno(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaMarcarRetorno,
  hoje: Date,
): Promise<Resultado<Retorno>> {
  const permitido = autorizarAcao(ator, "retorno:marcar");
  if (!permitido.ok) return permitido;

  if (!dataFutura(entrada.dataPrevista, hoje)) {
    return { ok: false, mensagem: MENSAGEM_DATA_FUTURA };
  }

  const consulta = await deps.agendamentos.buscarPorId(entrada.agendamentoOrigemId);
  if (!consulta || consulta.clinicaId !== ator.usuario.clinicaId || consulta.status !== "concluido") {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }

  const existente = await deps.retornos.buscarPorAgendamentoOrigem(consulta.id);
  if (existente) return { ok: false, mensagem: MENSAGEM_JA_TEM_RETORNO };

  const retorno: Retorno = {
    id: deps.ids.novo(),
    clinicaId: consulta.clinicaId,
    pacienteId: consulta.pacienteId,
    dentistaId: consulta.dentistaId,
    agendamentoOrigemId: consulta.id,
    marcadoPor: ator.usuario.id,
    dataPrevista: entrada.dataPrevista,
    status: "pendente",
  };
  await deps.retornos.salvar(retorno);
  return { ok: true, valor: retorno };
}

export async function removerRetorno(): Promise<Resultado<never>> {
  return { ok: false, mensagem: MENSAGEM_RETORNO_IMUTAVEL };
}

export async function configurarPrazo(
  deps: Dependencias,
  ator: Sessao,
  diasAntecedencia: number,
): Promise<Resultado<ConfiguracaoRetorno>> {
  const permitido = autorizarAcao(ator, "clinica:configurar");
  if (!permitido.ok) return permitido;

  if (!Number.isInteger(diasAntecedencia) || diasAntecedencia <= 0) {
    return { ok: false, mensagem: MENSAGEM_PRAZO };
  }

  const config: ConfiguracaoRetorno = { clinicaId: ator.usuario.clinicaId, diasAntecedencia };
  await deps.configuracoes.salvar(config);
  return { ok: true, valor: config };
}

export async function verificarRetornos(deps: Dependencias, hoje: Date): Promise<void> {
  const pendentes = await deps.retornos.listarPorStatus("pendente");
  const prazos = new Map<string, number>();

  for (const retorno of pendentes) {
    let prazo = prazos.get(retorno.clinicaId);
    if (prazo === undefined) {
      prazo = await obterPrazo(deps, retorno.clinicaId);
      prazos.set(retorno.clinicaId, prazo);
    }
    if (!dentroDoPrazo(retorno.dataPrevista, prazo, hoje)) continue;

    const paciente = await deps.pacientes.buscarPorId(retorno.pacienteId);
    if (!paciente?.nome) continue;

    await deps.avisos.avisarRecepcionista({
      clinicaId: retorno.clinicaId,
      agendamentoId: retorno.agendamentoOrigemId,
      pacienteId: retorno.pacienteId,
      motivo: textoAvisoRetorno(paciente.nome),
    });
    await publicarPorRegra(deps.notificacoes, {
      clinicaId: retorno.clinicaId,
      tipo: "retorno_reagendar",
      referenciaId: retorno.id,
      mensagem: textoAvisoRetorno(paciente.nome),
    });
    await deps.retornos.salvar({ ...retorno, status: "notificado" });
  }
}

export async function listarRetornosPendentes(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<RetornoVisivel[]>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };

  const retornos = await deps.retornos.listar(ator.usuario.clinicaId);
  const visiveis: RetornoVisivel[] = [];
  for (const retorno of retornos) {
    if (retorno.status === "reagendado") continue;
    const paciente = await deps.pacientes.buscarPorId(retorno.pacienteId);
    if (!paciente?.nome) continue;
    visiveis.push({ ...retorno, texto: textoAvisoRetorno(paciente.nome) });
  }
  return { ok: true, valor: visiveis };
}

export async function reagendarPorNovoAgendamento(
  deps: Dependencias,
  clinicaId: string,
  pacienteId: string,
): Promise<void> {
  const retornos = await deps.retornos.listar(clinicaId);
  for (const retorno of retornos) {
    if (retorno.pacienteId !== pacienteId || retorno.status === "reagendado") continue;
    await deps.retornos.salvar({ ...retorno, status: "reagendado" });
    await resolver(deps.notificacoes, clinicaId, "retorno_reagendar", retorno.id);
  }
}
