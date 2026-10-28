export type Material = {
  id: string;
  clinicaId: string;
  nome: string;
  quantidadeMinima: number;
};

export type Lote = {
  id: string;
  materialId: string;
  quantidade: number;
  validade: string;
  criadoEm: string;
};

export type Movimentacao = {
  id: string;
  materialId: string;
  loteId: string;
  tipo: "entrada" | "baixa" | "vencimento";
  quantidade: number;
  usuarioId: string | null;
  agendamentoId: string | null;
  registradoEm: string;
};

export type VinculoMaterial = {
  procedimentoId: string;
  materialId: string;
  quantidade: number;
};

export type AvisoEstoque = {
  id: string;
  materialId: string;
  tipo: "estoque_minimo" | "estoque_insuficiente";
  texto: string;
};

export type AjusteBaixa = { materialId: string; quantidade: number };

export type MaterialListado = Material & { quantidade: number };

export type MaterialDaConsulta = {
  materialId: string;
  nome: string;
  quantidade: number;
};

export type EntradaMaterial = {
  nome: string;
  quantidade: number;
  quantidadeMinima: number;
  validade: string;
};

export type EntradaLote = { quantidade: number; validade: string };

export type EntradaVinculo = {
  procedimentoId: string;
  materialId: string;
  quantidade: number;
};

export const MENSAGEM_MATERIAL_JA_CADASTRADO = "Material já cadastrado";
export const MENSAGEM_MATERIAL_NAO_ENCONTRADO = "Material não encontrado";
export const MENSAGEM_NOME = "Informe o nome";
export const MENSAGEM_QUANTIDADE = "Informe a quantidade";
export const MENSAGEM_QUANTIDADE_MINIMA = "Informe a quantidade mínima";
export const MENSAGEM_VALIDADE = "Informe a validade";
