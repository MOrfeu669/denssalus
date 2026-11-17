import type { Resultado } from "../../domain/auth/tipos";
import {
  MENSAGEM_NOME,
  MENSAGEM_QUANTIDADE,
  MENSAGEM_QUANTIDADE_MINIMA,
  MENSAGEM_VALIDADE,
  type EntradaLote,
  type EntradaMaterial,
} from "../../domain/estoque/tipos";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function lerInteiro(texto: string): number | null {
  const limpo = texto.trim();
  if (!/^\d+$/.test(limpo)) return null;
  const numero = Number(limpo);
  return Number.isSafeInteger(numero) ? numero : null;
}

function lerPositivo(texto: string): number | null {
  const numero = lerInteiro(texto);
  return numero !== null && numero > 0 ? numero : null;
}

function lerValidade(texto: string): string | null {
  const limpo = texto.trim();
  return DATA.test(limpo) ? limpo : null;
}

export type CamposMaterial = {
  nome: string;
  quantidade: string;
  quantidadeMinima: string;
  validade: string;
};

export function validarNovoMaterial(campos: CamposMaterial): Resultado<EntradaMaterial> {
  const nome = campos.nome.trim();
  if (!nome) return { ok: false, mensagem: MENSAGEM_NOME };
  const quantidade = lerPositivo(campos.quantidade);
  if (quantidade === null) return { ok: false, mensagem: MENSAGEM_QUANTIDADE };
  const quantidadeMinima = lerInteiro(campos.quantidadeMinima);
  if (quantidadeMinima === null) return { ok: false, mensagem: MENSAGEM_QUANTIDADE_MINIMA };
  const validade = lerValidade(campos.validade);
  if (validade === null) return { ok: false, mensagem: MENSAGEM_VALIDADE };
  return { ok: true, valor: { nome, quantidade, quantidadeMinima, validade } };
}

export function validarReabastecimento(campos: {
  quantidade: string;
  validade: string;
}): Resultado<EntradaLote> {
  const quantidade = lerPositivo(campos.quantidade);
  if (quantidade === null) return { ok: false, mensagem: MENSAGEM_QUANTIDADE };
  const validade = lerValidade(campos.validade);
  if (validade === null) return { ok: false, mensagem: MENSAGEM_VALIDADE };
  return { ok: true, valor: { quantidade, validade } };
}
