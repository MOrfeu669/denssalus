export type Procedimento = {
  id: string;
  clinicaId: string;
  nome: string;
  tempoMedioMinutos: number;
  valorMedio: number;
};

export type ResultadoProcedimento =
  | { ok: true; valor: Procedimento }
  | { ok: false; mensagem: string };

export type EntradaProcedimento = {
  nome: string;
  tempoMedioMinutos: number;
  valorMedio: number;
};

export const MENSAGEM_NOME = "Informe o nome";
export const MENSAGEM_TEMPO = "Informe o tempo médio";
export const MENSAGEM_VALOR = "Informe o valor médio";
export const MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO = "Procedimento não encontrado";
