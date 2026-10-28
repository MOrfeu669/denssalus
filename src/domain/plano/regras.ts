import { quadranteDe } from "../odontograma/regras";
import { MENSAGEM_DENTE_INVALIDO } from "../odontograma/tipos";
import { MENSAGEM_DENTE_OBRIGATORIO, MENSAGEM_VALOR } from "./tipos";

export function valorTotal(itens: { valor: number }[]): number {
  return itens.reduce((soma, item) => soma + item.valor, 0);
}

export function validarDentes(dentes: number[]): string | null {
  if (dentes.length === 0 || new Set(dentes).size !== dentes.length) {
    return MENSAGEM_DENTE_OBRIGATORIO;
  }
  if (dentes.some((dente) => quadranteDe(dente) === null)) return MENSAGEM_DENTE_INVALIDO;
  return null;
}

export function validarValor(valor: number): string | null {
  return Number.isFinite(valor) && valor >= 0 ? null : MENSAGEM_VALOR;
}

export function mesmoConjunto(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((dente) => b.includes(dente));
}
