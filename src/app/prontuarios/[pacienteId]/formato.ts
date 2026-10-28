const PADRAO_LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

// Horário de agendamento: texto da clínica, sem conversão de fuso.
export function dataAgendamento(valor: string): string {
  const partes = PADRAO_LOCAL.exec(valor);
  if (!partes) return valor;
  const [, ano, mes, dia, hora, minuto] = partes;
  const data = `${dia}/${mes}/${ano}`;
  return hora ? `${data} ${hora}:${minuto}` : data;
}

// Instante de registro: converte para o horário de Brasília.
export function instante(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function dataNascimento(valor: string): string {
  return dataAgendamento(valor);
}
