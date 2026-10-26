import type { Resultado } from "../../domain/auth/tipos";
import {
  MENSAGEM_NOME,
  MENSAGEM_TEMPO,
  MENSAGEM_VALOR,
  type EntradaProcedimento,
} from "../../domain/procedimento/tipos";

export type CamposProcedimento = {
  nome: string;
  tempoMedioMinutos: string;
  valorMedio: string;
};

// Inteiro maior que zero, sem sinal, sem casas.
function lerTempo(texto: string): number | null {
  const limpo = texto.trim();
  if (!/^\d+$/.test(limpo)) return null;
  const numero = Number(limpo);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

// Zero ou mais, com no máximo duas casas. A vírgula brasileira vira ponto.
function lerValor(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

export function validarProcedimento(campos: CamposProcedimento): Resultado<EntradaProcedimento> {
  const nome = campos.nome.trim();
  if (!nome) return { ok: false, mensagem: MENSAGEM_NOME };

  const tempoMedioMinutos = lerTempo(campos.tempoMedioMinutos);
  if (tempoMedioMinutos === null) return { ok: false, mensagem: MENSAGEM_TEMPO };

  const valorMedio = lerValor(campos.valorMedio);
  if (valorMedio === null) return { ok: false, mensagem: MENSAGEM_VALOR };

  return { ok: true, valor: { nome, tempoMedioMinutos, valorMedio } };
}
