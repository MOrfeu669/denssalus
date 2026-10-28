import type { Agendamento } from "../agendamento/tipos";
import type { Paciente } from "../paciente/tipos";

export type Anamnese = {
  pacienteId: string;
  conteudo: string;
  preenchidoPor: string;
  atualizadoEm: string;
};

export type Evolucao = {
  agendamentoId: string;
  texto: string;
  registradoPor: string;
  registradoEm: string;
};

export type RegistroAuditoria = {
  id: string;
  clinicaId: string;
  entidade: "anamnese" | "evolucao" | "documento" | "odontograma";
  entidadeId: string;
  usuarioId: string;
  acao: "criacao" | "edicao";
  conteudoAnterior: string | null;
  registradoEm: string;
};

export type ProntuarioAberto = {
  paciente: Paciente;
  anamnese: Anamnese | null;
  historico: Agendamento[];
  evolucoes: Evolucao[];
};

export const MENSAGEM_EVOLUCAO_VAZIA = "Informe a evolução";
export const MENSAGEM_EVOLUCAO_NAO_INICIADA = "A evolução só conclui um atendimento iniciado";
