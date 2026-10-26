import type { Resultado } from "../auth/tipos";
import {
  MENSAGEM_NOME,
  MENSAGEM_TEMPO,
  MENSAGEM_VALOR,
  type EntradaProcedimento,
} from "./tipos";

const TOLERANCIA_CENTAVOS = 1e-6;

export function tempoValido(tempo: number): boolean {
  return Number.isInteger(tempo) && tempo > 0;
}

export function valorValido(valor: number): boolean {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) return false;
  return Math.abs(valor * 100 - Math.round(valor * 100)) < TOLERANCIA_CENTAVOS;
}

export function normalizarEntrada(entrada: EntradaProcedimento): Resultado<EntradaProcedimento> {
  const nome = entrada.nome.trim();
  if (nome === "") return { ok: false, mensagem: MENSAGEM_NOME };
  if (!tempoValido(entrada.tempoMedioMinutos)) return { ok: false, mensagem: MENSAGEM_TEMPO };
  if (!valorValido(entrada.valorMedio)) return { ok: false, mensagem: MENSAGEM_VALOR };
  return {
    ok: true,
    valor: {
      nome,
      tempoMedioMinutos: entrada.tempoMedioMinutos,
      valorMedio: Math.round(entrada.valorMedio * 100) / 100,
    },
  };
}
