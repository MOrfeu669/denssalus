export type StatusAgendamento =
  | "agendado"
  | "em_espera"
  | "iniciado"
  | "concluido"
  | "cancelado";

export type Agendamento = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  dentistaId: string;
  cadeiraId: string;
  procedimentoId: string | null;
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  iniciadoPor: string | null;
  emergencia: boolean;
  criadoPor: string;
  alertaCadeira: boolean;
  alertaHorario: boolean;
  alertaDentista: boolean;
  motivoCancelamento: string | null;
  canceladoPor: string | null;
  canceladoEm: string | null;
};

export type BloqueioAgenda = {
  id: string;
  clinicaId: string;
  dentistaId: string;
  inicio: string;
  fim: string;
  motivo: string | null;
  criadoPor: string;
};

export type EntradaAgendamento = {
  pacienteId: string;
  dentistaId: string;
  cadeiraId: string;
  procedimentoId: string | null;
  inicio: string;
  fim: string;
};

export type EntradaBloqueio = {
  dentistaId: string;
  inicio: string;
  fim: string;
  motivo: string | null;
};

export type ConflitoAgenda = "cadeira" | "dentista" | "paciente";

export type OpcoesAgendamento = {
  pacientes: { id: string; nome: string }[];
  dentistas: { id: string; nome: string; usuarioId: string }[];
  cadeiras: { id: string; identificacao: string }[];
  procedimentos: { id: string; nome: string; tempoMedioMinutos: number }[];
};

export type FiltroAgenda = {
  data: string;
  dentistaId: string | null;
  cadeiraId: string | null;
};

export type AgendamentoNaGrade = Agendamento & {
  alerta: boolean;
  textoAlerta: string | null;
};

export type Grade = {
  dias: string[];
  horarioAbertura: string;
  horarioFechamento: string;
  agendamentos: AgendamentoNaGrade[];
  bloqueios: BloqueioAgenda[];
};

export const TEXTO_ALERTA_HORARIO = "fora de horário";
export const MENSAGEM_HORARIO_INVALIDO = "Informe um horário válido";
export const MENSAGEM_CADEIRA_INDISPONIVEL = "Cadeira indisponível";
export const MENSAGEM_DENTISTA_INDISPONIVEL = "Dentista indisponível";
export const MENSAGEM_DIA_SEM_ATENDIMENTO = "Clínica não atende nesse dia";
export const MENSAGEM_FORA_DO_HORARIO = "Fora do horário de funcionamento";
export const MENSAGEM_CADEIRA_OCUPADA = "Cadeira indisponível nesse horário";
export const MENSAGEM_DENTISTA_OCUPADO = "Dentista indisponível nesse horário";
export const MENSAGEM_PACIENTE_OCUPADO = "Paciente já possui agendamento nesse horário";
export const MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO = "Agendamento não encontrado";
export const MENSAGEM_MOTIVO_OBRIGATORIO = "Informe o motivo";
export const MENSAGEM_JA_CONCLUIDO = "Agendamento já concluído não pode ser cancelado";
