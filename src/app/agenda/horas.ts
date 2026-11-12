import type { VisaoGrade } from "./posicao";

export const ALTURA_HORA = 60;

export function horasDaGrade(
  abertura: string,
  fechamento: string,
  itens: { inicio: string; fim: string }[],
): number[] {
  const marcas = [
    ...faixaDeHoras(abertura, fechamento),
    ...itens.flatMap((item) => horasOcupadas(item.inicio, item.fim)),
  ];
  if (marcas.length === 0) return [];
  const min = Math.min(...marcas);
  const max = Math.max(...marcas);
  return Array.from({ length: max - min + 1 }, (_, indice) => min + indice);
}

export function foraDoExpediente(hora: number, abertura: string, fechamento: string) {
  const abre = Number(abertura.slice(0, 2)) * 60 + Number(abertura.slice(3, 5));
  const fecha = Number(fechamento.slice(0, 2)) * 60 + Number(fechamento.slice(3, 5));
  if (Number.isNaN(abre) || Number.isNaN(fecha)) return false;
  return hora * 60 < abre || hora * 60 >= fecha;
}

export function diaDeHoje() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function minutosDeAgora(visao: VisaoGrade, data: string, dias: string[], horas: number[]) {
  const hoje = diaDeHoje();
  if (horas.length === 0) return null;
  if (visao === "dia" && data !== hoje) return null;
  if (visao === "semana" && !dias.includes(hoje)) return null;
  const agora = new Date();
  const minutos = agora.getHours() * 60 + agora.getMinutes() - horas[0] * 60;
  const fim = horas.length * ALTURA_HORA;
  if (minutos < 0 || minutos > fim) return null;
  return minutos;
}

function faixaDeHoras(abertura: string, fechamento: string): number[] {
  const primeira = Number(abertura.slice(0, 2));
  const fim = Number(fechamento.slice(0, 2)) * 60 + Number(fechamento.slice(3, 5));
  if (Number.isNaN(primeira) || Number.isNaN(fim)) return [];
  const horas: number[] = [];
  for (let h = primeira; h * 60 < fim; h += 1) horas.push(h);
  return horas;
}

function horasOcupadas(inicio: string, fim: string): number[] {
  const hi = Number(inicio.slice(11, 13));
  const hf = Number(fim.slice(11, 13));
  const mf = Number(fim.slice(14, 16));
  if ([hi, hf, mf].some((n) => Number.isNaN(n))) return [];
  const mesmoDia = inicio.slice(0, 10) === fim.slice(0, 10);
  const ate = !mesmoDia ? 23 : mf > 0 ? hf : Math.max(hf - 1, hi);
  const de = Math.min(hi, ate);
  const ultima = Math.max(hi, ate);
  const horas: number[] = [];
  for (let h = de; h <= ultima; h += 1) horas.push(h);
  return horas;
}
