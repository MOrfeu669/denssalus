export type BaseDaClinica = {
  nome: string | null;
  temClinica: boolean;
  temCadeiraAtiva: boolean;
  temDentistaAtivo: boolean;
  temPaciente: boolean;
  temAgendamento: boolean;
};

export const BASE_VAZIA: BaseDaClinica = {
  nome: null,
  temClinica: false,
  temCadeiraAtiva: false,
  temDentistaAtivo: false,
  temPaciente: false,
  temAgendamento: false,
};
