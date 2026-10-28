export type OrigemRegistro = "atendimento" | "pre_existente";
export type StatusRegistro = "confirmado" | "revertido";
export type Quadrante =
  | "superior_direito"
  | "superior_esquerdo"
  | "inferior_esquerdo"
  | "inferior_direito";

export type RegistroOdontograma = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  dente: number;
  quadrante: Quadrante;
  procedimentoId: string;
  origem: OrigemRegistro;
  agendamentoId: string | null;
  status: StatusRegistro;
  registradoPor: string;
  registradoEm: string;
};

export const MENSAGEM_DENTE_INVALIDO = "Dente inválido";
export const MENSAGEM_REGISTROS_CONFIRMADOS =
  "Existem registros clínicos confirmados vinculados a este agendamento";
