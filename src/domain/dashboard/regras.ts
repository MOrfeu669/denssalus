import { ocorrenciasEntre } from "../agendamento/regras";
import type { Agendamento, BloqueioAgenda } from "../agendamento/tipos";
import type { Clinica, Dia } from "../clinica/tipos";
import type { Debito, Pagamento } from "../debito/tipos";
import type { Dentista } from "../dentista/tipos";
import { dataReal, lotesValidos, somarQuantidade } from "../estoque/regras";
import type { Lote, Material } from "../estoque/tipos";
import type { ItemPlano } from "../plano/tipos";
import type { Procedimento } from "../procedimento/tipos";
import type { Protese } from "../protese/tipos";
import type { PedidoPeriodo, ResumoDashboard } from "./tipos";

export type Periodo = ResumoDashboard["periodo"];

const DIA_MS = 86_400_000;
const HORA_MS = 3_600_000;
const DIAS_UTC: Dia[] = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

export function dataDe(instante: string): string {
  return instante.slice(0, 10);
}

function noPeriodo(data: string, periodo: Periodo): boolean {
  return data >= periodo.inicio && data <= periodo.fim;
}

function somarDias(data: string, dias: number): string {
  return new Date(Date.parse(`${data}T00:00:00.000Z`) + dias * DIA_MS).toISOString().slice(0, 10);
}

function intervaloValido(inicio: string, fim: string): boolean {
  return dataReal(inicio) && dataReal(fim) && inicio <= fim;
}

export function pedidoDoTexto(texto: string): PedidoPeriodo | null {
  if (texto === "hoje") return { tipo: "hoje" };
  if (texto === "mes") return { tipo: "mes" };
  if (texto === "7dias") return { tipo: "7dias" };
  const partes = /^(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})$/.exec(texto);
  if (!partes || !intervaloValido(partes[1], partes[2])) return null;
  return { tipo: "intervalo", inicio: partes[1], fim: partes[2] };
}

export function resolverPeriodo(pedido: PedidoPeriodo, hoje: Date): Periodo | null {
  const dia = hoje.toISOString().slice(0, 10);
  if (pedido.tipo === "hoje") return { inicio: dia, fim: dia };
  if (pedido.tipo === "mes") {
    const ultimo = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0));
    return { inicio: `${dia.slice(0, 7)}-01`, fim: ultimo.toISOString().slice(0, 10) };
  }
  if (pedido.tipo === "7dias") return { inicio: somarDias(dia, -6), fim: dia };
  if (pedido.tipo === "intervalo") {
    const { inicio, fim } = pedido;
    if (typeof inicio !== "string" || typeof fim !== "string") return null;
    return intervaloValido(inicio, fim) ? { inicio, fim } : null;
  }
  return null;
}

function diasDoPeriodo(periodo: Periodo): string[] {
  const dias: string[] = [];
  for (let dia = periodo.inicio; dia <= periodo.fim; dia = somarDias(dia, 1)) dias.push(dia);
  return dias;
}

function minutosDe(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + m;
}

function acumular(mapa: Map<string, number>, id: string, valor: number): void {
  mapa.set(id, (mapa.get(id) ?? 0) + valor);
}

export type Lancamento = {
  data: string;
  dentistaId: string;
  procedimentoId: string;
  valor: number;
};

export function periodoAnterior(periodo: Periodo): Periodo {
  const dias = diasDoPeriodo(periodo).length;
  const fim = somarDias(periodo.inicio, -1);
  return { inicio: somarDias(fim, -(dias - 1)), fim };
}

export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (!(anterior > 0)) return null;
  return ((atual - anterior) / anterior) * 100;
}

export function variacaoPontos(atual: number, anterior: number): number | null {
  if (atual === 0 && anterior === 0) return null;
  return atual - anterior;
}

/** A meta diária não está no cadastro da clínica. Só entra se o valor já vier preenchido. */
export function lerMetaDiaria(clinica: Clinica): number | null {
  const bruto = (clinica as Clinica & { metaDiaria?: unknown }).metaDiaria;
  if (typeof bruto !== "number" || !Number.isFinite(bruto) || bruto <= 0) return null;
  return bruto;
}

function diaUtil(clinica: Clinica, dia: string): boolean {
  return clinica.diasAtendimento.includes(DIAS_UTC[new Date(`${dia}T00:00:00.000Z`).getUTCDay()]);
}

export function serieDiaria(
  clinica: Clinica,
  lancamentos: Lancamento[],
  periodo: Periodo,
): { data: string; valor: number }[] {
  const todos = diasDoPeriodo(periodo);
  const uteis = todos.filter((dia) => diaUtil(clinica, dia));
  const dias = uteis.length > 0 ? uteis : todos;
  const mapa = new Map(dias.map((dia) => [dia, 0]));
  for (const item of lancamentos) {
    if (!mapa.has(item.data)) continue;
    mapa.set(item.data, (mapa.get(item.data) ?? 0) + item.valor);
  }
  return dias.map((data) => ({ data, valor: mapa.get(data) ?? 0 }));
}

function ordenado(mapa: Map<string, number>): [string, number][] {
  return [...mapa.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

export function lancamentosFaturados(
  clinicaId: string,
  agendamentos: Agendamento[],
  itens: ItemPlano[],
  procedimentos: Procedimento[],
  periodo: Periodo,
): Lancamento[] {
  const lista: Lancamento[] = [];
  const somar = (data: string, dentistaId: string, procedimentoId: string, valor: number) => {
    lista.push({ data, dentistaId, procedimentoId, valor });
  };
  for (const ag of agendamentos) {
    if (ag.clinicaId !== clinicaId || ag.status !== "concluido" || !ag.concluidoEm) continue;
    const data = dataDe(ag.concluidoEm);
    if (!noPeriodo(data, periodo)) continue;
    const concluidos = itens.filter((i) => i.agendamentoId === ag.id && i.status === "concluido");
    if (concluidos.length > 0) {
      for (const item of concluidos) somar(data, ag.dentistaId, item.procedimentoId, item.valor);
      continue;
    }
    const proc = procedimentos.find(
      (p) => p.id === ag.procedimentoId && p.clinicaId === clinicaId,
    );
    if (ag.procedimentoId && proc) somar(data, ag.dentistaId, proc.id, proc.valorMedio);
  }
  return lista;
}

export function calcularFaturamento(
  clinicaId: string,
  agendamentos: Agendamento[],
  itens: ItemPlano[],
  procedimentos: Procedimento[],
  periodo: Periodo,
) {
  const porDentista = new Map<string, number>();
  const porProcedimento = new Map<string, number>();
  const lancamentos = lancamentosFaturados(clinicaId, agendamentos, itens, procedimentos, periodo);
  let faturado = 0;
  for (const item of lancamentos) {
    faturado += item.valor;
    acumular(porDentista, item.dentistaId, item.valor);
    acumular(porProcedimento, item.procedimentoId, item.valor);
  }
  return {
    faturado,
    lancamentos,
    porDentista: ordenado(porDentista).map(([dentistaId, valor]) => ({ dentistaId, valor })),
    porProcedimento: ordenado(porProcedimento).map(([procedimentoId, valor]) => ({
      procedimentoId,
      valor,
    })),
  };
}

export function calcularRecebido(
  clinicaId: string,
  debitos: Debito[],
  pagamentos: Pagamento[],
  periodo: Periodo,
): number {
  const daClinica = new Map(debitos.filter((d) => d.clinicaId === clinicaId).map((d) => [d.id, d]));
  let total = 0;
  for (const pagamento of pagamentos) {
    const debito = daClinica.get(pagamento.debitoId);
    if (!debito || !noPeriodo(dataDe(pagamento.data), periodo)) continue;
    total += debito.valor - debito.desconto;
  }
  return total;
}

export function calcularDespesaProtese(
  clinicaId: string,
  proteses: Protese[],
  periodo: Periodo,
): number {
  let total = 0;
  for (const protese of proteses) {
    if (protese.clinicaId !== clinicaId || typeof protese.valorComissao !== "number") continue;
    const instalada = protese.historico.some(
      (p) => p.etapa === "instalacao" && noPeriodo(dataDe(p.em), periodo),
    );
    if (instalada) total += protese.valorComissao;
  }
  return total;
}

export function contarProtesesNoPeriodo(
  clinicaId: string,
  proteses: Protese[],
  periodo: Periodo,
): number {
  let total = 0;
  for (const protese of proteses) {
    if (protese.clinicaId !== clinicaId || typeof protese.valorComissao !== "number") continue;
    const instalada = protese.historico.some(
      (p) => p.etapa === "instalacao" && noPeriodo(dataDe(p.em), periodo),
    );
    if (instalada) total += 1;
  }
  return total;
}

export function calcularAReceber(
  clinicaId: string,
  debitos: Debito[],
): { valor: number; debitos: number } {
  const abertos = debitos.filter((d) => d.clinicaId === clinicaId && d.status === "em_aberto");
  return {
    debitos: abertos.length,
    valor: abertos.reduce((total, d) => total + Math.max(0, d.valor - d.desconto), 0),
  };
}

export function calcularCapacidade(
  clinica: Clinica,
  dentistas: Dentista[],
  bloqueios: BloqueioAgenda[],
  periodo: Periodo,
): number {
  const ativos = dentistas.filter((d) => d.ativo && d.clinicaId === clinica.id).length;
  const expediente = Math.max(
    0,
    (minutosDe(clinica.horarioFechamento) - minutosDe(clinica.horarioAbertura)) / 60,
  );
  const dias = diasDoPeriodo(periodo).filter((dia) =>
    clinica.diasAtendimento.includes(DIAS_UTC[new Date(`${dia}T00:00:00.000Z`).getUTCDay()]),
  );
  if (ativos === 0 || !(expediente > 0)) return 0;
  let bloqueado = 0;
  for (const dia of dias) {
    const abre = Date.parse(`${dia}T${clinica.horarioAbertura}:00.000Z`);
    const fecha = Date.parse(`${dia}T${clinica.horarioFechamento}:00.000Z`);
    const ate = `${somarDias(dia, 1)}T00:00`;
    for (const b of bloqueios.flatMap((item) => ocorrenciasEntre(item, `${dia}T00:00`, ate))) {
      if (b.clinicaId !== clinica.id) continue;
      const parte = Math.min(fecha, Date.parse(b.fim)) - Math.max(abre, Date.parse(b.inicio));
      if (parte > 0) bloqueado += parte / HORA_MS;
    }
  }
  return Math.max(0, ativos * expediente * dias.length - bloqueado);
}

export function calcularOcupacao(
  clinica: Clinica,
  agendamentos: Agendamento[],
  dentistas: Dentista[],
  bloqueios: BloqueioAgenda[],
  periodo: Periodo,
): number {
  const capacidade = calcularCapacidade(clinica, dentistas, bloqueios, periodo);
  if (capacidade === 0) return 0;
  let horas = 0;
  for (const ag of agendamentos) {
    if (ag.clinicaId !== clinica.id || ag.status !== "concluido") continue;
    if (!noPeriodo(dataDe(ag.inicio), periodo)) continue;
    horas += (Date.parse(ag.fim) - Date.parse(ag.inicio)) / HORA_MS;
  }
  return (horas / capacidade) * 100;
}

export function estoqueAbaixoDoMinimo(
  clinicaId: string,
  materiais: Material[],
  lotesPorMaterial: Map<string, Lote[]>,
  hoje: Date,
): ResumoDashboard["estoque"] {
  return materiais
    .filter((m) => m.clinicaId === clinicaId)
    .map((m) => ({
      materialId: m.id,
      nome: m.nome,
      quantidade: somarQuantidade(lotesValidos(lotesPorMaterial.get(m.id) ?? [], hoje)),
      minimo: m.quantidadeMinima,
    }))
    .filter((m) => m.quantidade < m.minimo)
    .sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0))
    .map(({ materialId, nome, quantidade, minimo }) => ({ materialId, nome, quantidade, minimo }));
}
