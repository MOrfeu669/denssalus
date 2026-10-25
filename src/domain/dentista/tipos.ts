export type Dentista = {
  id: string;
  usuarioId: string;
  clinicaId: string;
  nome: string;
  cro: string;
  telefone: string;
  cpf: string;
  especialidades: string[];
  ativo: boolean;
};

export type AgendamentoDoDentista = {
  id: string;
  clinicaId: string;
  dentistaId: string;
  inicio: string;
  alertaDentista: boolean;
};

export type EntradaCadastrarDentista = {
  nome: string;
  email: string;
  senha: string;
  cro: string;
  telefone: string;
  cpf: string;
  especialidades: string[];
};

export type EntradaEditarDentista = {
  nome: string;
  cro: string;
  telefone: string;
  cpf: string;
  especialidades: string[];
};

export const MENSAGEM_EMAIL_JA_CADASTRADO = "E-mail já cadastrado";
export const MENSAGEM_DENTISTA_NAO_ENCONTRADO = "Dentista não encontrado";
