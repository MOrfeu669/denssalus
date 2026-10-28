export const PAPEIS = ["admin", "dentista", "recepcionista"] as const;

export type Papel = (typeof PAPEIS)[number];

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  clinicaId: string;
  ativo: boolean;
};

export type Sessao = {
  usuario: Usuario;
};

export type Resultado<T> =
  | { ok: true; valor: T }
  | { ok: false; mensagem: string };

export const MENSAGEM_CREDENCIAIS = "Credenciais inválidas";
export const MENSAGEM_PAPEL = "Ação não permitida para seu papel";

export type Acao =
  | "clinica:configurar"
  | "dentista:cadastrar"
  | "odontograma:preencher"
  | "paciente:cadastrar"
  | "procedimento:cadastrar"
  | "procedimento:excluir"
  | "usuario:cadastrar"
  | "usuario:remover"
  | "agendamento:criar"
  | "agendamento:bloquear"
  | "agendamento:cancelar"
  | "agenda:ver"
  | "retorno:marcar"
  | "anamnese:preencher"
  | "evolucao:registrar"
  | "auditoria:ler"
  | "plano:editar";
