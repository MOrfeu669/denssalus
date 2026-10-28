import { MENSAGEM_DENTE_INVALIDO } from "../odontograma/tipos";
import { quadranteDe } from "../odontograma/regras";
import {
  MENSAGEM_CAMINHO_INVALIDO,
  MENSAGEM_DESCRICAO,
  MENSAGEM_TAMANHO,
  MENSAGEM_TIPO_CASO,
  TETO_BYTES,
  type EntradaImagem,
} from "./tipos";

export function caminhoEsperado(clinicaId: string, pacienteId: string, id: string): string {
  return `${clinicaId}/${pacienteId}/${id}`;
}

export function prazoDeRemocao(excluidoEm: Date): string {
  const limite = new Date(excluidoEm.getTime());
  limite.setUTCMonth(limite.getUTCMonth() + 3);
  return limite.toISOString();
}

export function emOrdemCronologica<T extends { adicionadoEm: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => a.adicionadoEm.localeCompare(b.adicionadoEm));
}

// Devolve a mensagem do primeiro erro de forma, ou null. A ordem segue o contrato da spec.
export function validarEntrada(
  entrada: EntradaImagem,
  clinicaId: string,
): { mensagem: string } | null {
  const { tamanhoBytes, tipoCaso, descricao, dente } = entrada;
  if (!Number.isFinite(tamanhoBytes) || tamanhoBytes <= 0 || tamanhoBytes > TETO_BYTES) {
    return { mensagem: MENSAGEM_TAMANHO };
  }
  if (!tipoCaso.trim()) return { mensagem: MENSAGEM_TIPO_CASO };
  if (!descricao.trim()) return { mensagem: MENSAGEM_DESCRICAO };
  if (dente !== null && quadranteDe(dente) === null) return { mensagem: MENSAGEM_DENTE_INVALIDO };
  if (entrada.caminho !== caminhoEsperado(clinicaId, entrada.pacienteId, entrada.id)) {
    return { mensagem: MENSAGEM_CAMINHO_INVALIDO };
  }
  return null;
}
