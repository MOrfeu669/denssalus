export type StatusRetorno = "pendente" | "notificado" | "reagendado";

export type Retorno = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  dentistaId: string;
  agendamentoOrigemId: string;
  marcadoPor: string;
  dataPrevista: string;
  status: StatusRetorno;
};

export type ConfiguracaoRetorno = {
  clinicaId: string;
  diasAntecedencia: number;
};

export type EntradaMarcarRetorno = {
  agendamentoOrigemId: string;
  dataPrevista: string;
};

export type RetornoVisivel = Retorno & { texto: string };

export const MENSAGEM_DATA_FUTURA = "Informe uma data futura";
export const MENSAGEM_JA_TEM_RETORNO = "Esta consulta já tem retorno";
export const MENSAGEM_RETORNO_IMUTAVEL = "Retorno programado não pode ser removido";
export const MENSAGEM_PRAZO = "Informe o prazo";
export const PRAZO_PADRAO = 7;

export function textoAvisoRetorno(nomePaciente: string): string {
  return `Paciente ${nomePaciente} precisa ser reagendado`;
}
