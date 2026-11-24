const INSTANTE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;

function parte(valor: number): string {
  return String(valor).padStart(2, "0");
}

function ler(texto: string): Date | null {
  const achou = INSTANTE.exec(texto.trim());
  if (!achou) return null;
  const ano = Number(achou[1]);
  const mes = Number(achou[2]);
  const dia = Number(achou[3]);
  const hora = Number(achou[4]);
  const minuto = Number(achou[5]);
  if (mes < 1 || mes > 12 || hora > 23 || minuto > 59) return null;
  const data = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
  const mesma =
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia &&
    data.getHours() === hora &&
    data.getMinutes() === minuto;
  return mesma ? data : null;
}

function texto(data: Date): string {
  return `${data.getFullYear()}-${parte(data.getMonth() + 1)}-${parte(data.getDate())}T${parte(data.getHours())}:${parte(data.getMinutes())}`;
}

export function camposDoHorario(inicio: string): { data: string; hora: string } | null {
  const achou = INSTANTE.exec(inicio.trim());
  if (!achou || !ler(inicio)) return null;
  return { data: `${achou[1]}-${achou[2]}-${achou[3]}`, hora: `${achou[4]}:${achou[5]}` };
}

// Mantém a duração do horário atual, como o arrastar da agenda conserva a altura do cartão.
export function horarioRemarcado(
  inicioAtual: string,
  fimAtual: string,
  data: string,
  hora: string,
): { inicio: string; fim: string } | null {
  const de = ler(inicioAtual);
  const ate = ler(fimAtual);
  if (!de || !ate || ate.getTime() <= de.getTime()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const inicio = ler(`${data}T${hora}`);
  if (!inicio) return null;
  const fim = new Date(inicio.getTime() + (ate.getTime() - de.getTime()));
  return { inicio: texto(inicio), fim: texto(fim) };
}
