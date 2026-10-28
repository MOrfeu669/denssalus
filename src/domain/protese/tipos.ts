export type EtapaProtese =
  | "pre_envio"
  | "envio_acompanhamento"
  | "recebimento_conferencia"
  | "instalacao";

export type StatusProtese = "em_andamento" | "concluida" | "descontinuada";

export type PassagemProtese = { etapa: EtapaProtese; usuarioId: string; em: string };

export type Protese = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  dentes: number[];
  tipo: string;
  responsavelId: string;
  laboratorio: string;
  procedimentoAvaliacaoId: string | null;
  procedimentoCirurgiaId: string | null;
  agendamentoInstalacaoId: string | null;
  etapa: EtapaProtese;
  status: StatusProtese;
  prazoRetorno: string | null;
  ajusteNecessario: string | null;
  valorComissao: number | null;
  alertaAtraso: boolean;
  historico: PassagemProtese[];
};

export type ConfigAtrasoProtese = { clinicaId: string; diasLimiteAtraso: number };

export type AvisoProtese = {
  id: string;
  clinicaId: string;
  proteseId: string;
  tipo: "atraso_protese";
  criadoEm: string;
};

export type EntradaPedidoProtese = {
  pacienteId: string;
  dentes: number[];
  tipo: string;
  responsavelId: string;
  laboratorio: string;
  procedimentoAvaliacaoId?: string | null;
  procedimentoCirurgiaId?: string | null;
};

export const LIMITE_ATRASO_PADRAO = 15;
export const LIMITE_ATRASO_MINIMO = 15;
export const LIMITE_ATRASO_MAXIMO = 30;

export const MENSAGEM_DENTE = "Informe ao menos um dente";
export const MENSAGEM_DENTE_INVALIDO = "Dente inválido";
export const MENSAGEM_TIPO = "Informe o tipo de prótese";
export const MENSAGEM_LABORATORIO = "Informe o laboratório";
export const MENSAGEM_PRAZO = "Informe o prazo de retorno";
export const MENSAGEM_AJUSTE = "A prótese ainda precisa de ajuste";
export const MENSAGEM_COMISSAO = "Informe a comissão";
export const MENSAGEM_LIMITE = "Informe o limite de atraso";
export const MENSAGEM_PROTESE_NAO_ENCONTRADA = "Prótese não encontrada";
export const MENSAGEM_SAIDA = "A saída só pode ser registrada em pré-envio";
export const MENSAGEM_CONFERENCIA = "A conferência só pode ser feita no acompanhamento";
export const MENSAGEM_INSTALACAO = "A instalação só pode ser feita após a conferência";
export const MENSAGEM_ANDAMENTO = "O pedido não está em andamento";
