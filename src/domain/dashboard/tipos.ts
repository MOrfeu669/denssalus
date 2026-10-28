export const CAMPOS_DASHBOARD = [
  "faturamento",
  "recebido",
  "despesa",
  "ocupacao",
  "estoque",
  "detalhe",
] as const;

export type CampoDashboard = (typeof CAMPOS_DASHBOARD)[number];

export type ResumoDashboard = {
  periodo: { inicio: string; fim: string };
  faturado: number;
  recebido: number;
  despesaProtese: number;
  porDentista: { dentistaId: string; valor: number }[];
  porProcedimento: { procedimentoId: string; valor: number }[];
  ocupacao: number;
  estoque: { materialId: string; nome: string; quantidade: number }[];
};

export type VisaoDashboard = {
  resumo: ResumoDashboard;
  ocultos: CampoDashboard[];
  periodoSalvo: string;
};

export type PedidoPeriodo =
  | { tipo: "mes" }
  | { tipo: "7dias" }
  | { tipo: "intervalo"; inicio: string; fim: string };

export type ArquivoDashboard = { nome: string; bytes: Uint8Array; mediaType: string };

export const MENSAGEM_CAMPO_INVALIDO = "Campo inválido";
export const MENSAGEM_PERIODO = "Informe o período";
