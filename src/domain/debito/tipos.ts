export type OrigemDebito = "item_plano" | "procedimento_avulso";
export type StatusDebito = "em_aberto" | "quitado";

export const FORMAS_PAGAMENTO = [
  "dinheiro",
  "pix",
  "cartao_debito",
  "cartao_credito",
  "boleto",
  "cheque",
] as const;

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export type Debito = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  origem: OrigemDebito;
  itemPlanoId: string | null;
  agendamentoId: string;
  valor: number;
  desconto: number;
  descontoPor: string | null;
  status: StatusDebito;
};

export type Pagamento = {
  id: string;
  debitoId: string;
  forma: FormaPagamento;
  data: string;
  registradoPor: string;
};

export type DebitoComPagamento = Debito & { pagamento: Pagamento | null };

export const MENSAGEM_DEBITO_NAO_ENCONTRADO = "Débito não encontrado";
export const MENSAGEM_DESCONTO = "Desconto maior que o valor";
export const MENSAGEM_JA_QUITADO = "Débito já quitado";
export const MENSAGEM_FORMA = "Informe a forma de pagamento";
export const MENSAGEM_DATA = "Informe a data";
