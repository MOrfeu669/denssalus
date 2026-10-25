import { DIAS, type Cadeira, type Dia, type Funcionamento } from "./tipos";

export const HORARIO_PADRAO = { abertura: "08:00", fechamento: "18:00" } as const;

// Date#getDay: 0 = domingo. O fuso é o do processo; a Feature 006 decide o fuso da clínica.
const DIA_POR_INDICE: Dia[] = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

export function nomeCadeira(numero: number): string {
  return `Cadeira ${numero}`;
}

export function normalizarDias(dias: Dia[]): Dia[] {
  return DIAS.filter((dia) => dias.includes(dia));
}

function minutos(horario: string): number {
  const [hora, minuto] = horario.split(":");
  return Number(hora) * 60 + Number(minuto);
}

function minutosDoDia(data: Date): number {
  return data.getHours() * 60 + data.getMinutes();
}

function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function foraDoHorario(funcionamento: Funcionamento, inicio: string, fim: string): boolean {
  const de = new Date(inicio);
  const ate = new Date(fim);
  if (!funcionamento.diasAtendimento.includes(DIA_POR_INDICE[de.getDay()])) return true;

  const abertura = minutos(funcionamento.horarioAbertura);
  const fechamento = minutos(funcionamento.horarioFechamento);
  if (minutosDoDia(de) < abertura || minutosDoDia(de) >= fechamento) return true;
  if (!mesmoDia(de, ate)) return true;
  return minutosDoDia(ate) > fechamento;
}

export function bloqueiaNovoAgendamento(
  funcionamento: Funcionamento,
  cadeira: Pick<Cadeira, "ativa">,
  inicio: string,
  fim: string,
): boolean {
  return !cadeira.ativa || foraDoHorario(funcionamento, inicio, fim);
}
