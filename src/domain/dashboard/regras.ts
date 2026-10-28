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
  if (texto === "mes") return { tipo: "mes" };
  if (texto === "7dias") return { tipo: "7dias" };
  const partes = /^(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})$/.exec(texto);
  if (!partes || !intervaloValido(partes[1], partes[2])) return null;
  return { tipo: "intervalo", inicio: partes[1], fim: partes[2] };
}

export function resolverPeriodo(pedido: PedidoPeriodo, hoje: Date): Periodo | null {
  const dia = hoje.toISOString().slice(0, 10);
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

function ordenado(mapa: Map<string, number>): [string, number][] {
  return [...mapa.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
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
  let faturado = 0;
  const somar = (dentistaId: string, procedimentoId: string, valor: number) => {
    faturado += valor;
    acumular(porDentista, dentistaId, valor);
    acumular(porProcedimento, procedimentoId, valor);
  };
  for (const ag of agendamentos) {
    if (ag.clinicaId !== clinicaId || ag.status !== "concluido" || !ag.concluidoEm) continue;
    if (!noPeriodo(dataDe(ag.concluidoEm), periodo)) continue;
    const concluidos = itens.filter((i) => i.agendamentoId === ag.id && i.status === "concluido");
    if (concluidos.length > 0) {
      for (const item of concluidos) somar(ag.dentistaId, item.procedimentoId, item.valor);
      continue;
    }
    const proc = procedimentos.find(
      (p) => p.id === ag.procedimentoId && p.clinicaId === clinicaId,
    );
    if (ag.procedimentoId && proc) somar(ag.dentistaId, proc.id, proc.valorMedio);
  }
  return {
    faturado,
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
    for (const b of bloqueios) {
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
    .map(({ materialId, nome, quantidade }) => ({ materialId, nome, quantidade }));
}
