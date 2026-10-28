"use server";

import {
  definirCamposDoPapel,
  definirPreferencia,
  exportar,
} from "../../domain/dashboard/casos";
import { pedidoDoTexto } from "../../domain/dashboard/regras";
import { MENSAGEM_PERIODO, type CampoDashboard } from "../../domain/dashboard/tipos";
import { dependenciasDashboard } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";

const SEM_SESSAO = "Nenhuma sessão aberta";

export type Papel = "admin" | "dentista" | "recepcionista";
export type FormatoExportacao = "pdf" | "excel";

export type RespostaDashboard = { ok: true } | { ok: false; mensagem: string };
export type RespostaExportacao =
  | { ok: true; base64: string; nome: string; mediaType: string }
  | { ok: false; mensagem: string };

export async function salvarPreferencia(
  widgetsOcultos: CampoDashboard[],
  periodo: string,
): Promise<RespostaDashboard> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };
    const resultado = await definirPreferencia(dependenciasDashboard(), sessao, {
      widgetsOcultos,
      periodo,
    });
    if (!resultado.ok) return { ok: false, mensagem: resultado.mensagem };
    return { ok: true };
  } catch (causa) {
    return falha(causa);
  }
}

export async function salvarCamposDoPapel(
  papel: Papel,
  camposOcultos: CampoDashboard[],
): Promise<RespostaDashboard> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };
    const resultado = await definirCamposDoPapel(
      dependenciasDashboard(),
      sessao,
      papel,
      camposOcultos,
    );
    if (!resultado.ok) return { ok: false, mensagem: resultado.mensagem };
    return { ok: true };
  } catch (causa) {
    return falha(causa);
  }
}

export async function exportarResumo(
  periodo: string,
  formato: FormatoExportacao,
): Promise<RespostaExportacao> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };
    // O periodoSalvo vira PedidoPeriodo pelo texto que o domínio já entende.
    const pedido = pedidoDoTexto(periodo);
    if (!pedido) return { ok: false, mensagem: MENSAGEM_PERIODO };
    const resultado = await exportar(
      dependenciasDashboard(),
      sessao,
      pedido,
      formato,
      new Date(),
    );
    if (!resultado.ok) return { ok: false, mensagem: resultado.mensagem };
    const { nome, bytes, mediaType } = resultado.valor;
    return { ok: true, base64: Buffer.from(bytes).toString("base64"), nome, mediaType };
  } catch (causa) {
    return falha(causa);
  }
}
