export type VisaoGrade = "dia" | "semana";

export type FaixaCartao = {
  coluna: number;
  topoMinutos: number;
  alturaMinutos: number;
};

const HORARIO = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/;

function ler(iso: string): { dia: string; minutos: number } | null {
  const achou = HORARIO.exec(iso);
  if (!achou) return null;
  const hora = Number(achou[2]);
  const minuto = Number(achou[3]);
  if (hora > 23 || minuto > 59) return null;
  return { dia: achou[1], minutos: hora * 60 + minuto };
}

// Coluna do dentista no dia, ou do dia na semana, e a faixa a partir da primeira hora da grade.
export function posicaoDoCartao(
  visao: VisaoGrade,
  item: { inicio: string; fim: string; dentistaId: string },
  colunas: readonly string[],
  primeiraHora: number,
): FaixaCartao | null {
  const inicio = ler(item.inicio);
  const fim = ler(item.fim);
  if (!inicio || !fim) return null;
  const chave = visao === "dia" ? item.dentistaId : inicio.dia;
  const coluna = colunas.indexOf(chave);
  if (coluna < 0) return null;
  const alturaMinutos = fim.dia === inicio.dia ? fim.minutos - inicio.minutos : 24 * 60 - inicio.minutos;
  if (alturaMinutos <= 0) return null;
  return {
    coluna,
    topoMinutos: inicio.minutos - primeiraHora * 60,
    alturaMinutos,
  };
}
