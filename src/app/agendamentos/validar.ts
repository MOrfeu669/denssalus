import type { Resultado } from "../../domain/auth/tipos";

export type CamposAgendamento = {
  pacienteId: string;
  dentistaId: string;
  cadeiraId: string;
  procedimentoId: string;
  inicio: string;
  fim: string;
};

export type CamposBloqueio = {
  dentistaId: string;
  inicio: string;
  fim: string;
  motivo: string;
};

export type AgendamentoValidado = {
  pacienteId: string;
  dentistaId: string;
  cadeiraId: string;
  procedimentoId: string | null;
  inicio: string;
  fim: string;
};

export type BloqueioValidado = {
  dentistaId: string;
  inicio: string;
  fim: string;
  motivo: string | null;
};

const MENSAGEM_PACIENTE = "Informe o paciente";
const MENSAGEM_DENTISTA = "Informe o dentista";
const MENSAGEM_CADEIRA = "Informe a cadeira";
const MENSAGEM_HORARIO = "Informe um horário válido";

function vazioParaNulo(valor: string): string | null {
  const limpo = valor.trim();
  return limpo ? limpo : null;
}

// `datetime-local`: data e hora locais, com segundos opcionais. Data inexistente não passa.
function instanteLocal(texto: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(texto);
  if (!match) return null;
  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const hora = Number(match[4]);
  const minuto = Number(match[5]);
  const segundo = match[6] === undefined ? 0 : Number(match[6]);
  if (mes < 1 || mes > 12 || hora > 23 || minuto > 59 || segundo > 59) return null;
  const data = new Date(ano, mes - 1, dia, hora, minuto, segundo, 0);
  const mesmoInstante =
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia &&
    data.getHours() === hora &&
    data.getMinutes() === minuto &&
    data.getSeconds() === segundo;
  return mesmoInstante ? data.getTime() : null;
}

function validarHorario(
  inicioBruto: string,
  fimBruto: string,
): Resultado<{ inicio: string; fim: string }> {
  const inicio = inicioBruto.trim();
  const fim = fimBruto.trim();
  const inicioMs = instanteLocal(inicio);
  const fimMs = instanteLocal(fim);
  if (inicioMs === null || fimMs === null || fimMs <= inicioMs) {
    return { ok: false, mensagem: MENSAGEM_HORARIO };
  }
  return { ok: true, valor: { inicio, fim } };
}

export function validarAgendamento(campos: CamposAgendamento): Resultado<AgendamentoValidado> {
  const pacienteId = vazioParaNulo(campos.pacienteId);
  if (!pacienteId) return { ok: false, mensagem: MENSAGEM_PACIENTE };
  const dentistaId = vazioParaNulo(campos.dentistaId);
  if (!dentistaId) return { ok: false, mensagem: MENSAGEM_DENTISTA };
  const cadeiraId = vazioParaNulo(campos.cadeiraId);
  if (!cadeiraId) return { ok: false, mensagem: MENSAGEM_CADEIRA };

  const horario = validarHorario(campos.inicio, campos.fim);
  if (!horario.ok) return horario;

  return {
    ok: true,
    valor: {
      pacienteId,
      dentistaId,
      cadeiraId,
      procedimentoId: vazioParaNulo(campos.procedimentoId),
      inicio: horario.valor.inicio,
      fim: horario.valor.fim,
    },
  };
}

export function validarBloqueio(campos: CamposBloqueio): Resultado<BloqueioValidado> {
  const dentistaId = vazioParaNulo(campos.dentistaId);
  if (!dentistaId) return { ok: false, mensagem: MENSAGEM_DENTISTA };

  const horario = validarHorario(campos.inicio, campos.fim);
  if (!horario.ok) return horario;

  return {
    ok: true,
    valor: {
      dentistaId,
      inicio: horario.valor.inicio,
      fim: horario.valor.fim,
      motivo: vazioParaNulo(campos.motivo),
    },
  };
}
