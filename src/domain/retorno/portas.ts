import type { Agendamentos, Avisos } from "../agendamento/portas";
import type { Pacientes } from "../paciente/portas";
import type { ConfiguracaoRetorno, Retorno } from "./tipos";

export type Retornos = {
  listar(clinicaId: string): Promise<Retorno[]>;
  listarPorStatus(status: "pendente"): Promise<Retorno[]>;
  buscarPorAgendamentoOrigem(id: string): Promise<Retorno | null>;
  salvar(retorno: Retorno): Promise<void>;
};

export type ConfiguracoesRetorno = {
  buscar(clinicaId: string): Promise<ConfiguracaoRetorno | null>;
  salvar(config: ConfiguracaoRetorno): Promise<void>;
};

export type ResolvedorRetorno = {
  concluirPendentes(clinicaId: string, pacienteId: string): Promise<void>;
};

export type Dependencias = {
  retornos: Retornos;
  configuracoes: ConfiguracoesRetorno;
  agendamentos: Pick<Agendamentos, "buscarPorId">;
  pacientes: Pick<Pacientes, "buscarPorId">;
  avisos: Avisos;
  ids: { novo(): string };
};
