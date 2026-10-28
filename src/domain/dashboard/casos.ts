import { autorizarAcao } from "../auth/casos";
import {
  MENSAGEM_PAPEL,
  PAPEIS,
  type Papel,
  type Resultado,
  type Sessao,
} from "../auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../clinica/tipos";
import type { Lote } from "../estoque/tipos";
import { gerarArquivo } from "./exportacao";
import type { Dependencias } from "./portas";
import {
  calcularDespesaProtese,
  calcularFaturamento,
  calcularOcupacao,
  calcularRecebido,
  estoqueAbaixoDoMinimo,
  pedidoDoTexto,
  resolverPeriodo,
  type Periodo,
} from "./regras";
import {
  CAMPOS_DASHBOARD,
  MENSAGEM_CAMPO_INVALIDO,
  MENSAGEM_PERIODO,
  type ArquivoDashboard,
  type CampoDashboard,
  type PedidoPeriodo,
  type ResumoDashboard,
  type VisaoDashboard,
} from "./tipos";

function camposValidos(campos: string[]): CampoDashboard[] | null {
  const validos = campos.filter((c): c is CampoDashboard =>
    (CAMPOS_DASHBOARD as readonly string[]).includes(c),
  );
  if (validos.length !== campos.length || new Set(campos).size !== campos.length) return null;
  return validos;
}

function soValidos(campos: string[]): CampoDashboard[] {
  return CAMPOS_DASHBOARD.filter((c) => campos.includes(c));
}

async function montarResumo(
  deps: Dependencias,
  clinicaId: string,
  periodo: Periodo,
  hoje: Date,
): Promise<ResumoDashboard | null> {
  const clinica = await deps.clinicas.buscarPorId(clinicaId);
  if (!clinica || clinica.id !== clinicaId) return null;
  const [agendamentos, bloqueios, debitos, itens, procedimentos, proteses, materiais, dentistas] =
    await Promise.all([
      deps.agendamentos.listar(clinicaId),
      deps.bloqueios.listar(clinicaId),
      deps.debitos.listar(clinicaId),
      deps.itens.listarPorClinica(clinicaId),
      deps.procedimentos.listar(clinicaId),
      deps.proteses.listarPorClinica(clinicaId),
      deps.materiais.listar(clinicaId),
      deps.dentistas.listar(clinicaId),
    ]);
  const debitosDaClinica = debitos.filter((d) => d.clinicaId === clinicaId);
  const pagamentos = await deps.pagamentos.listarPorDebitos(debitosDaClinica.map((d) => d.id));
  const lotes = new Map<string, Lote[]>();
  for (const m of materiais.filter((m) => m.clinicaId === clinicaId)) {
    lotes.set(m.id, await deps.lotes.listarPorMaterial(m.id));
  }
  const faturamento = calcularFaturamento(clinicaId, agendamentos, itens, procedimentos, periodo);
  return {
    periodo,
    ...faturamento,
    recebido: calcularRecebido(clinicaId, debitosDaClinica, pagamentos, periodo),
    despesaProtese: calcularDespesaProtese(clinicaId, proteses, periodo),
    ocupacao: calcularOcupacao(clinica, agendamentos, dentistas, bloqueios, periodo),
    estoque: estoqueAbaixoDoMinimo(clinicaId, materiais, lotes, hoje),
  };
}

export async function obterResumo(
  deps: Dependencias,
  ator: Sessao,
  pedido: PedidoPeriodo | null,
  hoje: Date,
): Promise<Resultado<VisaoDashboard>> {
  const permitido = autorizarAcao(ator, "dashboard:ver");
  if (!permitido.ok) return permitido;
  const { clinicaId, id: usuarioId, papel } = ator.usuario;

  const preferencia = await deps.preferencias.buscar(usuarioId);
  const periodoSalvo =
    preferencia && pedidoDoTexto(preferencia.periodo) ? preferencia.periodo : "mes";
  const efetivo = pedido ?? pedidoDoTexto(periodoSalvo);
  const periodo = efetivo ? resolverPeriodo(efetivo, hoje) : null;
  if (!periodo) return { ok: false, mensagem: MENSAGEM_PERIODO };

  const resumo = await montarResumo(deps, clinicaId, periodo, hoje);
  if (!resumo) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };

  const doPapel = await deps.visibilidade.buscar(clinicaId, papel);
  const widgets = preferencia?.widgetsOcultos ?? [];
  const ocultos = soValidos([...doPapel, ...widgets]);
  return { ok: true, valor: { resumo, ocultos, periodoSalvo } };
}

export async function definirCamposDoPapel(
  deps: Dependencias,
  ator: Sessao,
  papel: Papel,
  camposOcultos: string[],
): Promise<Resultado<void>> {
  const permitido = autorizarAcao(ator, "dashboard:ver");
  if (!permitido.ok) return permitido;
  if (ator.usuario.papel !== "admin" || !PAPEIS.includes(papel)) {
    return { ok: false, mensagem: MENSAGEM_PAPEL };
  }
  const campos = camposValidos(camposOcultos);
  if (!campos) return { ok: false, mensagem: MENSAGEM_CAMPO_INVALIDO };
  await deps.visibilidade.salvar(ator.usuario.clinicaId, papel, campos);
  return { ok: true, valor: undefined };
}

export async function definirPreferencia(
  deps: Dependencias,
  ator: Sessao,
  entrada: { widgetsOcultos: string[]; periodo: string },
): Promise<Resultado<void>> {
  const permitido = autorizarAcao(ator, "dashboard:ver");
  if (!permitido.ok) return permitido;
  if (!pedidoDoTexto(entrada.periodo)) return { ok: false, mensagem: MENSAGEM_PERIODO };
  const widgets = camposValidos(entrada.widgetsOcultos);
  if (!widgets) return { ok: false, mensagem: MENSAGEM_CAMPO_INVALIDO };
  await deps.preferencias.salvar(ator.usuario.id, widgets, entrada.periodo);
  return { ok: true, valor: undefined };
}

export async function exportar(
  deps: Dependencias,
  ator: Sessao,
  pedido: PedidoPeriodo | null,
  formato: "pdf" | "excel",
  hoje: Date,
): Promise<Resultado<ArquivoDashboard>> {
  const visao = await obterResumo(deps, ator, pedido, hoje);
  if (!visao.ok) return visao;
  return { ok: true, valor: gerarArquivo(visao.valor, formato) };
}
