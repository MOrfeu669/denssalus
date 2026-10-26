import type { Resultado } from "../auth/tipos";
import {
  MENSAGEM_CANAL_PREFERIDO,
  MENSAGEM_SEM_CANAL,
  type CanalComunicacao,
} from "./tipos";

const MAIORIDADE = 18;
const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

export function dataValida(texto: string): boolean {
  const partes = FORMATO_DATA.exec(texto);
  if (!partes) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  );
}

export function paraTextoData(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function idadeEm(nascimento: string, hoje: Date): number {
  const [ano, mes, dia] = nascimento.split("-").map(Number);
  let idade = hoje.getFullYear() - ano;
  const aniversarioPassou =
    hoje.getMonth() + 1 > mes || (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia);
  if (!aniversarioPassou) idade -= 1;
  return idade;
}

export function menorDeIdade(nascimento: string | null, hoje: Date): boolean {
  if (!nascimento) return false;
  return idadeEm(nascimento, hoje) < MAIORIDADE;
}

export function normalizarCanais(canais: CanalComunicacao[]): Resultado<CanalComunicacao[]> {
  const validos = canais
    .map((item) => ({ ...item, contato: item.contato.trim() }))
    .filter((item) => item.contato !== "");
  if (validos.length === 0) return { ok: false, mensagem: MENSAGEM_SEM_CANAL };
  if (validos.length === 1) {
    return { ok: true, valor: [{ ...validos[0], preferido: true }] };
  }
  const preferidos = validos.filter((item) => item.preferido).length;
  if (preferidos !== 1) return { ok: false, mensagem: MENSAGEM_CANAL_PREFERIDO };
  return { ok: true, valor: validos };
}
