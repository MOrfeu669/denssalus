export const TETO_BYTES = 20 * 1024 * 1024;
export const MENSAGEM_TAMANHO = "O arquivo passa de 20 MB";
export const MENSAGEM_TIPO_CASO = "Informe o tipo de caso";
export const MENSAGEM_DESCRICAO = "Informe a descrição";
export const MENSAGEM_CAMINHO_INVALIDO = "Caminho inválido";
export const MENSAGEM_IMAGEM_NAO_ENCONTRADA = "Imagem não encontrada";

export type ImagemProntuario = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  agendamentoId: string | null;
  dente: number | null;
  tipoCaso: string;
  descricao: string;
  caminho: string;
  tamanhoBytes: number;
  adicionadoPor: string;
  adicionadoEm: string;
  excluidoEm: string | null;
  remocaoDefinitivaEm: string | null;
};

export type PreparoUpload = { id: string; caminho: string };

export type EntradaImagem = {
  id: string;
  pacienteId: string;
  agendamentoId: string | null;
  dente: number | null;
  tipoCaso: string;
  descricao: string;
  caminho: string;
  tamanhoBytes: number;
};
