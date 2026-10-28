export type StatusPlano = "proposto" | "em_andamento" | "concluido";
export type StatusItem = "pendente" | "concluido";

export type PlanoTratamento = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  criadoPor: string;
  status: StatusPlano;
  criadoEm: string;
};

export type ItemPlano = {
  id: string;
  planoId: string;
  procedimentoId: string;
  dentes: number[];
  valor: number;
  agendamentoId: string | null;
  status: StatusItem;
  executadoPor: string | null;
  concluidoEm: string | null;
};

export type PlanoComItens = PlanoTratamento & { itens: ItemPlano[]; valorTotal: number };

export type EntradaItem = {
  procedimentoId: string;
  dentes: number[];
  valor: number;
  agendamentoId: string | null;
};

export const MENSAGEM_DENTE_OBRIGATORIO = "Informe ao menos um dente";
export const MENSAGEM_VALOR = "Informe o valor";
export const MENSAGEM_ITEM_CONCLUIDO = "Item concluído não pode ser alterado";
export const MENSAGEM_PLANO_CONCLUIDO = "Plano concluído não pode ser alterado";
