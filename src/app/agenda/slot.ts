export type IntervaloSlot = {
  inicio: string;
  fim: string;
};

const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

function par(n: number) {
  return String(n).padStart(2, "0");
}

// A célula da grade é a hora cheia. O fim é a hora seguinte, no dia seguinte se passar da meia-noite.
export function intervaloDaHora(dia: string, hora: number): IntervaloSlot | null {
  if (!DIA.test(dia) || !Number.isInteger(hora) || hora < 0 || hora > 23) return null;
  return intervaloEntreMinutos(dia, hora * 60, (hora + 1) * 60);
}

const PASSO_MINUTO = 15;

export function encaixarMinuto(minutos: number, passo = PASSO_MINUTO): number {
  return Math.round(minutos / passo) * passo;
}

// Minutos contados desde 00:00 do dia. 24:00 vira 00:00 do dia seguinte.
export function intervaloEntreMinutos(
  dia: string,
  inicioMinutos: number,
  fimMinutos: number,
): IntervaloSlot | null {
  if (!DIA.test(dia) || !Number.isInteger(inicioMinutos) || !Number.isInteger(fimMinutos)) return null;
  if (inicioMinutos < 0 || fimMinutos <= inicioMinutos || fimMinutos > 24 * 60) return null;
  return {
    inicio: instante(dia, inicioMinutos),
    fim: fimMinutos === 24 * 60 ? instante(diaSeguinte(dia), 0) : instante(dia, fimMinutos),
  };
}

function instante(dia: string, minutos: number): string {
  const hora = Math.floor(minutos / 60);
  const minuto = minutos % 60;
  return `${dia}T${par(hora)}:${par(minuto)}`;
}

function diaSeguinte(dia: string): string {
  const [ano, mes, diaNum] = dia.split("-").map(Number);
  const seguinte = new Date(ano, mes - 1, diaNum + 1);
  return `${seguinte.getFullYear()}-${par(seguinte.getMonth() + 1)}-${par(seguinte.getDate())}`;
}
