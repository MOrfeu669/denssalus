export const DIAS = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
] as const;

export type Dia = (typeof DIAS)[number];

export type Clinica = {
  id: string;
  nome: string;
  adminId: string;
  diasAtendimento: Dia[];
  horarioAbertura: string;
  horarioFechamento: string;
};

export type Cadeira = {
  id: string;
  clinicaId: string;
  identificacao: string;
  ativa: boolean;
};

export type AgendamentoFuturo = {
  id: string;
  clinicaId: string;
  cadeiraId: string;
  inicio: string;
  fim: string;
  alertaCadeira: boolean;
  alertaHorario: boolean;
};

export type DetalheClinica = {
  clinica: Clinica;
  cadeiras: Cadeira[];
};

export type Funcionamento = {
  diasAtendimento: Dia[];
  horarioAbertura: string;
  horarioFechamento: string;
};

export type EntradaCriarClinica = {
  nome: string;
  diasAtendimento: Dia[];
  horarioAbertura?: string;
  horarioFechamento?: string;
  cadeiras: number;
};

export const MENSAGEM_JA_TEM_CLINICA = "Esta conta já tem uma clínica";
export const MENSAGEM_CADEIRA_NAO_ENCONTRADA = "Cadeira não encontrada";
export const MENSAGEM_CLINICA_NAO_ENCONTRADA = "Clínica não encontrada";
export const TEXTO_FORA_DE_HORARIO = "fora de horário";
