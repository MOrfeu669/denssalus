import { bloqueiaNovoAgendamento } from "../clinica/regras";
import type { Cadeira, Clinica, Dia } from "../clinica/tipos";
import { bloqueiaDentistaInativo } from "../dentista/regras";
import type { Dentista } from "../dentista/tipos";
import {
  MENSAGEM_CADEIRA_INDISPONIVEL,
  MENSAGEM_CADEIRA_OCUPADA,
  MENSAGEM_DENTISTA_INDISPONIVEL,
  MENSAGEM_DENTISTA_OCUPADO,
  MENSAGEM_DIA_SEM_ATENDIMENTO,
  MENSAGEM_FORA_DO_HORARIO,
  MENSAGEM_PACIENTE_OCUPADO,
  TEXTO_ALERTA_HORARIO,
  type Agendamento,
  type AgendamentoNaGrade,
  type BloqueioAgenda,
  type ConflitoAgenda,
  type EntradaAgendamento,
  type FiltroAgenda,
  type Grade,
  type StatusAgendamento,
} from "./tipos";

const DIA_POR_INDICE: Dia[] = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const FORMATO_HORARIO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const STATUS_ATIVO: readonly StatusAgendamento[] = ["agendado", "em_espera", "iniciado"];
const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})/;

type OrigemGrade = {
  agendamentos: Agendamento[];
  bloqueios: BloqueioAgenda[];
  cadeiras: { id: string; ativa: boolean }[];
  dentistas: { id: string; ativo: boolean }[];
};

export function somarDias(data: string, dias: number): string | null {
  const partes = FORMATO_DATA.exec(data);
  if (!partes || data.length !== 10) return null;
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const base = new Date(ano, mes - 1, dia);
  if (base.getFullYear() !== ano || base.getMonth() !== mes - 1 || base.getDate() !== dia) {
    return null;
  }
  const alvo = new Date(ano, mes - 1, dia + dias);
  const mesAlvo = String(alvo.getMonth() + 1).padStart(2, "0");
  const diaAlvo = String(alvo.getDate()).padStart(2, "0");
  return `${alvo.getFullYear()}-${mesAlvo}-${diaAlvo}`;
}

export function semanaDe(data: string): string[] {
  if (somarDias(data, 0) === null) return [];
  const [ano, mes, dia] = data.split("-").map(Number);
  const desdeSegunda = (new Date(ano, mes - 1, dia).getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, indice) => somarDias(data, indice - desdeSegunda) as string);
}

export function filtrarGrade(
  filtro: FiltroAgenda & { modo: "dia" | "semana" },
  origem: OrigemGrade,
  expediente: { horarioAbertura: string; horarioFechamento: string },
): Grade {
  const dias = semanaDe(filtro.data);
  const visiveis = filtro.modo === "dia" ? [filtro.data] : dias;
  const noPeriodo = (item: { inicio: string }) =>
    FORMATO_DATA.test(item.inicio) && visiveis.includes(item.inicio.slice(0, 10));
  const doDentista = (item: { dentistaId: string }) =>
    filtro.dentistaId === null || item.dentistaId === filtro.dentistaId;
  const cadeiraInativa = (id: string) => !origem.cadeiras.find((item) => item.id === id)?.ativa;
  const dentistaInativo = (id: string) => !origem.dentistas.find((item) => item.id === id)?.ativo;

  const agendamentos: AgendamentoNaGrade[] = origem.agendamentos
    .filter((item) => noPeriodo(item) && doDentista(item))
    .filter((item) => filtro.cadeiraId === null || item.cadeiraId === filtro.cadeiraId)
    .map((item) => ({
      ...item,
      alerta:
        item.alertaCadeira ||
        item.alertaHorario ||
        item.alertaDentista ||
        cadeiraInativa(item.cadeiraId) ||
        dentistaInativo(item.dentistaId),
      textoAlerta: item.alertaHorario ? TEXTO_ALERTA_HORARIO : null,
    }));
  const bloqueios = origem.bloqueios.filter((item) => noPeriodo(item) && doDentista(item));

  return {
    dias,
    horarioAbertura: expediente.horarioAbertura,
    horarioFechamento: expediente.horarioFechamento,
    agendamentos,
    bloqueios,
  };
}

export function sugerirFim(inicio: string, tempoMedioMinutos: number): string {
  const data = new Date(inicio);
  const fim = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    data.getHours(),
    data.getMinutes() + tempoMedioMinutos,
  );
  const mes = String(fim.getMonth() + 1).padStart(2, "0");
  const dia = String(fim.getDate()).padStart(2, "0");
  const hora = String(fim.getHours()).padStart(2, "0");
  const minuto = String(fim.getMinutes()).padStart(2, "0");
  return `${fim.getFullYear()}-${mes}-${dia}T${hora}:${minuto}`;
}

// Intervalo [inicio, fim): 14:00–14:30 e 14:30–15:00 não se sobrepõem.
export function intervalosSobrepoem(
  a: { inicio: string; fim: string },
  b: { inicio: string; fim: string },
): boolean {
  return a.inicio < b.fim && b.inicio < a.fim;
}

export function ocupaAgenda(agendamento: Pick<Agendamento, "status" | "emergencia">): boolean {
  return !agendamento.emergencia && STATUS_ATIVO.includes(agendamento.status);
}

export function horarioValido(inicio: string, fim: string): boolean {
  const de = dataLocal(inicio);
  const ate = dataLocal(fim);
  if (!de || !ate) return false;
  return ate.getTime() > de.getTime();
}

export function mensagemDeConflito(conflito: ConflitoAgenda): string {
  if (conflito === "cadeira") return MENSAGEM_CADEIRA_OCUPADA;
  if (conflito === "dentista") return MENSAGEM_DENTISTA_OCUPADO;
  return MENSAGEM_PACIENTE_OCUPADO;
}

export function mensagemDosSetePassos(
  clinica: Clinica,
  cadeira: Pick<Cadeira, "ativa">,
  dentista: Pick<Dentista, "ativo">,
  entrada: Pick<EntradaAgendamento, "inicio" | "fim" | "cadeiraId" | "dentistaId" | "pacienteId">,
  agendamentos: Agendamento[],
  bloqueios: BloqueioAgenda[],
): string | null {
  if (!cadeira.ativa && bloqueiaNovoAgendamento(clinica, cadeira, entrada.inicio, entrada.fim)) {
    return MENSAGEM_CADEIRA_INDISPONIVEL;
  }
  if (bloqueiaDentistaInativo(dentista)) return MENSAGEM_DENTISTA_INDISPONIVEL;
  if (!clinica.diasAtendimento.includes(DIA_POR_INDICE[new Date(entrada.inicio).getDay()])) {
    return MENSAGEM_DIA_SEM_ATENDIMENTO;
  }
  if (intervaloForaDoExpediente(clinica, entrada.inicio, entrada.fim)) {
    return MENSAGEM_FORA_DO_HORARIO;
  }

  const ativos = agendamentos.filter((item) => item.clinicaId === clinica.id && ocupaAgenda(item));
  const cruza = (item: { inicio: string; fim: string }) => intervalosSobrepoem(item, entrada);

  if (ativos.some((item) => item.cadeiraId === entrada.cadeiraId && cruza(item))) {
    return MENSAGEM_CADEIRA_OCUPADA;
  }
  const dentistaOcupado = ativos.some((item) => item.dentistaId === entrada.dentistaId && cruza(item));
  const bloqueado = bloqueios.some(
    (item) => item.clinicaId === clinica.id && item.dentistaId === entrada.dentistaId && cruza(item),
  );
  if (dentistaOcupado || bloqueado) return MENSAGEM_DENTISTA_OCUPADO;
  if (ativos.some((item) => item.pacienteId === entrada.pacienteId && cruza(item))) {
    return MENSAGEM_PACIENTE_OCUPADO;
  }
  return null;
}

function dataLocal(texto: string): Date | null {
  if (texto === "") return null;
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

function intervaloForaDoExpediente(
  clinica: Pick<Clinica, "horarioAbertura" | "horarioFechamento">,
  inicio: string,
  fim: string,
): boolean {
  const de = new Date(inicio);
  const ate = new Date(fim);
  const abertura = minutos(clinica.horarioAbertura);
  const fechamento = minutos(clinica.horarioFechamento);
  if (minutosDoDia(de) < abertura || minutosDoDia(de) >= fechamento) return true;
  if (!mesmoDia(de, ate)) return true;
  return minutosDoDia(ate) > fechamento;
}
