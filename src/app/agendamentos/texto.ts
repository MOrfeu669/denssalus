export const SEM_SESSAO = "Nenhuma sessão aberta.";

export const ROTULO_CRIAR = "Criar agendamento";
export const PENDENTE_CRIAR = "Criando…";
export const ROTULO_EMERGENCIA = "Registrar emergência";
export const PENDENTE_EMERGENCIA = "Registrando…";
export const ROTULO_INICIAR = "Iniciar";
export const PENDENTE_INICIAR = "Iniciando…";

export const ROTULO_CHEGADA = "Marcar chegada";
export const PENDENTE_CHEGADA = "Marcando chegada…";
export const ROTULO_CANCELAR = "Cancelar";
export const PENDENTE_CANCELAR = "Cancelando…";
export const ROTULO_EVOLUCAO = "Salvar evolução";
export const PENDENTE_EVOLUCAO = "Salvando…";
export const CAMPO_EVOLUCAO = "Evolução";
export const CAMPO_MOTIVO = "Motivo";
export const PERGUNTA_REAGENDAR = "Deseja reagendar?";
export const RESPOSTA_SIM = "Sim";
export const RESPOSTA_NAO = "Não";
export const CAMINHO_AGENDA = "/agenda";

export const ROTULO_BLOQUEAR = "Bloquear";
export const PENDENTE_BLOQUEAR = "Bloqueando…";

export const VAZIO_AGENDAMENTOS = "Nenhum agendamento nesta clínica.";
export const TEXTO_GRADE_ATUALIZA = "A grade atualiza quando outra pessoa cria um horário.";
export const VAZIO_DIA = "Nenhum horário neste dia.";
export const VAZIO_SEMANA = "Nenhum horário nesta semana.";

export function rotuloDoBotao(rotulo: string, pendente: string, emCurso: boolean): string {
  return emCurso ? pendente : rotulo;
}

export function vazioDaGrade(visao: "dia" | "semana"): string {
  return visao === "dia" ? VAZIO_DIA : VAZIO_SEMANA;
}

const DATA_HORA = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;

type Partes = { dia: string; hora: string };

function partes(iso: string): Partes | null {
  const achou = DATA_HORA.exec(iso);
  if (!achou) return null;
  return { dia: `${achou[3]}/${achou[2]}/${achou[1]}`, hora: `${achou[4]}:${achou[5]}` };
}

// Intervalo legível para a lista: "31/10/2026 09:00–10:00". Texto fora do padrão passa como veio.
export function intervaloLegivel(inicio: string, fim: string): string {
  const a = partes(inicio);
  const b = partes(fim);
  if (!a || !b) return `${inicio}–${fim}`;
  if (a.dia === b.dia) return `${a.dia} ${a.hora}–${b.hora}`;
  return `${a.dia} ${a.hora} – ${b.dia} ${b.hora}`;
}

// Faixa dentro de uma coluna da grade, onde o dia já está no cabeçalho: "09:00–10:00".
export function horarioDoDia(inicio: string, fim: string): string {
  const a = partes(inicio);
  const b = partes(fim);
  if (!a || !b || a.dia !== b.dia) return intervaloLegivel(inicio, fim);
  return `${a.hora}–${b.hora}`;
}
