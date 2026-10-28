import type { Resultado } from "../auth/tipos";
import {
  MENSAGEM_NOME,
  MENSAGEM_QUANTIDADE,
  MENSAGEM_QUANTIDADE_MINIMA,
  MENSAGEM_VALIDADE,
  type EntradaLote,
  type EntradaMaterial,
  type Lote,
} from "./tipos";

export type Consumo = { lote: Lote; quantidade: number };

export function inteiroPositivo(valor: number): boolean {
  return Number.isInteger(valor) && valor > 0;
}

export function inteiroNaoNegativo(valor: number): boolean {
  return Number.isInteger(valor) && valor >= 0;
}

export function dataReal(valor: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(0);
  data.setUTCFullYear(ano, mes - 1, dia);
  return (
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  );
}

export function validarLote(entrada: EntradaLote): Resultado<EntradaLote> {
  if (!inteiroPositivo(entrada.quantidade)) return { ok: false, mensagem: MENSAGEM_QUANTIDADE };
  if (!dataReal(entrada.validade)) return { ok: false, mensagem: MENSAGEM_VALIDADE };
  return { ok: true, valor: entrada };
}

export function validarMaterial(entrada: EntradaMaterial): Resultado<EntradaMaterial> {
  const nome = entrada.nome.trim();
  if (!nome) return { ok: false, mensagem: MENSAGEM_NOME };
  if (!inteiroPositivo(entrada.quantidade)) return { ok: false, mensagem: MENSAGEM_QUANTIDADE };
  if (!inteiroNaoNegativo(entrada.quantidadeMinima)) {
    return { ok: false, mensagem: MENSAGEM_QUANTIDADE_MINIMA };
  }
  if (!dataReal(entrada.validade)) return { ok: false, mensagem: MENSAGEM_VALIDADE };
  return { ok: true, valor: { ...entrada, nome } };
}

export function loteVencido(lote: Lote, hoje: Date): boolean {
  return hoje.toISOString().slice(0, 10) > lote.validade;
}

export function lotesValidos(lotes: Lote[], hoje: Date): Lote[] {
  return lotes.filter((lote) => !loteVencido(lote, hoje));
}

export function somarQuantidade(lotes: Lote[]): number {
  return lotes.reduce((total, lote) => total + lote.quantidade, 0);
}

export function ordenarFefo(lotes: Lote[]): Lote[] {
  return [...lotes].sort((a, b) => {
    if (a.validade !== b.validade) return a.validade < b.validade ? -1 : 1;
    if (a.criadoEm !== b.criadoEm) return a.criadoEm < b.criadoEm ? -1 : 1;
    return 0;
  });
}

export function planejarConsumo(
  lotesValidosDoMaterial: Lote[],
  pedido: number,
): { consumos: Consumo[]; faltou: number } {
  const consumos: Consumo[] = [];
  let restante = pedido;
  for (const lote of ordenarFefo(lotesValidosDoMaterial)) {
    if (restante <= 0) break;
    if (lote.quantidade <= 0) continue;
    const tirado = Math.min(lote.quantidade, restante);
    consumos.push({ lote, quantidade: tirado });
    restante -= tirado;
  }
  return { consumos, faltou: restante };
}

export function textoEstoqueMinimo(nome: string, quantidadeValida: number): string {
  return `${nome}: quantidade ${quantidadeValida}`;
}

export function textoEstoqueInsuficiente(nome: string, faltou: number): string {
  return `${nome}: faltou ${faltou}`;
}
