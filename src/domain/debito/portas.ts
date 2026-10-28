import type { Agendamentos } from "../agendamento/portas";
import type { Pacientes } from "../paciente/portas";
import type { ItensPlanoPorta } from "../plano/portas";
import type { Procedimentos } from "../procedimento/portas";
import type { Debito, Pagamento } from "./tipos";

export type Debitos = {
  listarPorPaciente(clinicaId: string, pacienteId: string): Promise<Debito[]>;
  listarPorAgendamento(clinicaId: string, agendamentoId: string): Promise<Debito[]>;
  buscarPorId(id: string): Promise<Debito | null>;
  salvar(debito: Debito): Promise<void>;
};

export type Pagamentos = {
  listarPorDebitos(debitoIds: string[]): Promise<Pagamento[]>;
  salvar(pagamento: Pagamento): Promise<void>;
};

export type Dependencias = {
  debitos: Debitos;
  pagamentos: Pagamentos;
  itens: Pick<ItensPlanoPorta, "listarPorAgendamento">;
  agendamentos: Pick<Agendamentos, "buscarPorId">;
  procedimentos: Pick<Procedimentos, "buscarPorId">;
  pacientes: Pick<Pacientes, "buscarPorId">;
  ids: { novo(): string };
};
