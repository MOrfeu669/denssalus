import type { Quadrante } from "./tipos";

const FAIXAS: { quadrante: Quadrante; dezena: number; lado: "esquerda" | "direita" }[] = [
  { quadrante: "superior_direito", dezena: 1, lado: "esquerda" },
  { quadrante: "superior_esquerdo", dezena: 2, lado: "direita" },
  { quadrante: "inferior_esquerdo", dezena: 3, lado: "direita" },
  { quadrante: "inferior_direito", dezena: 4, lado: "esquerda" },
];

function faixaDe(dente: number) {
  if (!Number.isInteger(dente)) return null;
  const unidade = dente % 10;
  if (unidade < 1 || unidade > 8) return null;
  return FAIXAS.find((faixa) => faixa.dezena === Math.floor(dente / 10)) ?? null;
}

export function quadranteDe(dente: number): Quadrante | null {
  return faixaDe(dente)?.quadrante ?? null;
}

export function ladoDaTela(dente: number): "esquerda" | "direita" | null {
  return faixaDe(dente)?.lado ?? null;
}

function sequencia(inicio: number, fim: number): number[] {
  const passo = inicio <= fim ? 1 : -1;
  const lista: number[] = [];
  for (let n = inicio; n !== fim + passo; n += passo) lista.push(n);
  return lista;
}

export function fileiras(): { superior: number[]; inferior: number[] } {
  return {
    superior: [...sequencia(18, 11), ...sequencia(21, 28)],
    inferior: [...sequencia(48, 41), ...sequencia(31, 38)],
  };
}
