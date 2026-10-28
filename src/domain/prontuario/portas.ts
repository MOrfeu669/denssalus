import type { Agendamentos } from "../agendamento/portas";
import type { Pacientes } from "../paciente/portas";
import type { Anamnese, Evolucao, RegistroAuditoria } from "./tipos";

export type Anamneses = {
  buscar(pacienteId: string): Promise<Anamnese | null>;
  salvar(anamnese: Anamnese): Promise<void>;
};

export type Evolucoes = {
  buscar(agendamentoId: string): Promise<Evolucao | null>;
  listar(agendamentoIds: string[]): Promise<Evolucao[]>;
  salvar(evolucao: Evolucao): Promise<void>;
};

export type Auditoria = {
  registrar(registro: RegistroAuditoria): Promise<void>;
  listar(clinicaId: string): Promise<RegistroAuditoria[]>;
};

export type BaixaEstoque = {
  baixar(agendamentoId: string): Promise<void>;
};

export type Dependencias = {
  anamneses: Anamneses;
  evolucoes: Evolucoes;
  auditoria: Auditoria;
  estoque: BaixaEstoque;
  agendamentos: Pick<Agendamentos, "buscarPorId" | "listar" | "salvar">;
  pacientes: Pick<Pacientes, "buscarPorId">;
  ids: { novo(): string };
};
