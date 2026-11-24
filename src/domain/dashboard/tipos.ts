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
  estoque: { materialId: string; nome: string; quantidade: number; minimo: number }[];
};

export type DiaFaturado = { data: string; valor: number };

export type ApresentacaoDashboard = {
  diario: DiaFaturado[];
  metaDiaria: number | null;
  aReceber: { valor: number; debitos: number };
  dentistas: { dentistaId: string; nome: string; especialidade: string; valor: number }[];
  procedimentos: {
    procedimentoId: string;
    nome: string;
    quantidade: number;
    valor: number;
    participacao: number;
  }[];
  variacaoFaturado: number | null;
  variacaoOcupacao: number | null;
  parteRecebida: number | null;
  trabalhosProtese: number;
};

export type VisaoDashboard = {
  resumo: ResumoDashboard;
  apresentacao: ApresentacaoDashboard;
  ocultos: CampoDashboard[];
  periodoSalvo: string;
};

export type PedidoPeriodo =
  | { tipo: "hoje" }
  | { tipo: "mes" }
  | { tipo: "7dias" }
  | { tipo: "intervalo"; inicio: string; fim: string };

export type ArquivoDashboard = { nome: string; bytes: Uint8Array; mediaType: string };

export const MENSAGEM_CAMPO_INVALIDO = "Campo inválido";
export const MENSAGEM_PERIODO = "Informe o período";
