export type TipoModelo = "padrao" | "personalizado";

export type ModeloDocumento = {
  id: string;
  clinicaId: string;
  criadoPor: string | null;
  compartilhado: boolean;
  nome: string;
  tipo: TipoModelo;
  conteudo: string;
};

export type DocumentoGerado = {
  id: string;
  clinicaId: string;
  modeloId: string;
  pacienteId: string;
  anteriorId: string | null;
  conteudoFinal: string;
  pdf: Uint8Array;
  assinatura: string;
  geradoPor: string;
  geradoEm: string;
};

export type DadosDocumento = {
  paciente: { nome: string; cpf: string | null; dataNascimento: string | null };
  dentista: { nome: string; cro: string | null };
  data: string;
};

export const MENSAGEM_MODELO_NAO_ENCONTRADO = "Modelo não encontrado";
export const MENSAGEM_DOCUMENTO_NAO_ENCONTRADO = "Documento não encontrado";
