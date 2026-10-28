import { quadranteDe } from "../odontograma/regras";
import {
  LIMITE_ATRASO_MAXIMO,
  LIMITE_ATRASO_MINIMO,
  MENSAGEM_ANDAMENTO,
  MENSAGEM_COMISSAO,
  MENSAGEM_DENTE,
  MENSAGEM_DENTE_INVALIDO,
  MENSAGEM_LIMITE,
  MENSAGEM_PRAZO,
  type EtapaProtese,
  type Protese,
} from "./tipos";

type Falha = { mensagem: string } | null;

// Lista sem repetição, na ordem informada.
export function validarDentes(dentes: number[]): { dentes: number[] } | { mensagem: string } {
  if (dentes.length === 0) return { mensagem: MENSAGEM_DENTE };
  if (dentes.some((dente) => quadranteDe(dente) === null)) return { mensagem: MENSAGEM_DENTE_INVALIDO };
  return { dentes: [...new Set(dentes)] };
}

// Data civil YYYY-MM-DD válida (aceita sufixo de horário; só os 10 primeiros caracteres valem).
export function normalizarPrazo(prazo: unknown): { prazo: string } | { mensagem: string } {
  if (typeof prazo !== "string" || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(prazo)) return { mensagem: MENSAGEM_PRAZO };
  const data = prazo.slice(0, 10);
  const [ano, mes, dia] = data.split("-").map(Number);
  const ref = new Date(Date.UTC(ano, mes - 1, dia));
  if (ref.getUTCFullYear() !== ano || ref.getUTCMonth() !== mes - 1 || ref.getUTCDate() !== dia) {
    return { mensagem: MENSAGEM_PRAZO };
  }
  return { prazo: data };
}

export function validarComissao(valor: unknown): Falha {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) return { mensagem: MENSAGEM_COMISSAO };
  return null;
}

export function validarLimite(dias: number): Falha {
  if (!Number.isInteger(dias) || dias < LIMITE_ATRASO_MINIMO || dias > LIMITE_ATRASO_MAXIMO) {
    return { mensagem: MENSAGEM_LIMITE };
  }
  return null;
}

export function textoOuNulo(texto: string | null | undefined): string | null {
  const aparado = texto?.trim() ?? "";
  return aparado === "" ? null : aparado;
}

// Status primeiro: pedido encerrado não está em andamento, seja qual for a etapa.
export function validarEtapa(protese: Protese, esperada: EtapaProtese, mensagemEtapa: string): Falha {
  if (protese.status !== "em_andamento") return { mensagem: MENSAGEM_ANDAMENTO };
  if (protese.etapa !== esperada) return { mensagem: mensagemEtapa };
  return null;
}

// Atrasa quando a data civil UTC de agora é >= prazo + limite dias.
export function estaAtrasada(protese: Protese, limiteDias: number, agora: Date): boolean {
  if (protese.etapa !== "envio_acompanhamento" || protese.status !== "em_andamento") return false;
  if (protese.prazoRetorno === null) return false;
  const [ano, mes, dia] = protese.prazoRetorno.split("-").map(Number);
  const vence = new Date(Date.UTC(ano, mes - 1, dia + limiteDias)).toISOString().slice(0, 10);
  return agora.toISOString().slice(0, 10) >= vence;
}
