import type { TipoMensagem } from "./tipos";

const FORMATO_HORARIO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const MS_HORA = 60 * 60 * 1000;

export const TEXTOS_PADRAO: Record<TipoMensagem, string> = {
  confirmacao_agendamento:
    "Você foi agendado para uma consulta dia {{agendamento.data}} às {{agendamento.hora}}",
  lembrete_24h: "Você tem uma consulta marcada",
  lembrete_5h: "Lembrete: você tem uma consulta em 5 horas",
};

export function aplicarVariaveis(conteudo: string, nomePaciente: string, inicio: string): string {
  const partes = FORMATO_HORARIO.exec(inicio);
  const valores: Record<string, string> = {
    "{{paciente.nome}}": nomePaciente,
    "{{agendamento.data}}": partes ? `${partes[3]}/${partes[2]}` : "",
    "{{agendamento.hora}}": partes ? `${partes[4]}:${partes[5]}` : "",
  };
  return conteudo.replace(
    /\{\{(?:paciente\.nome|agendamento\.data|agendamento\.hora)\}\}/g,
    (chave) => valores[chave] ?? "",
  );
}

export function inicioJaPassou(inicio: string, agora: Date): boolean {
  const instante = instanteLocal(inicio);
  if (!instante) return true;
  return instante.getTime() < agora.getTime();
}

export function instanteDoLembrete(inicio: string, horas: number): Date | null {
  const instante = instanteLocal(inicio);
  if (!instante) return null;
  return new Date(instante.getTime() - horas * MS_HORA);
}

function instanteLocal(texto: string): Date | null {
  const partes = FORMATO_HORARIO.exec(texto);
  if (!partes) return null;
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const hora = Number(partes[4]);
  const minuto = Number(partes[5]);
  const data = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia ||
    data.getHours() !== hora ||
    data.getMinutes() !== minuto
  ) {
    return null;
  }
  return data;
}
