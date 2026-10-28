import type { Agendamentos } from "../agendamento/portas";
import type { RegistrosOdontograma } from "../odontograma/portas";
import type { Pacientes } from "../paciente/portas";
import type { Procedimentos } from "../procedimento/portas";
import type { Auditoria } from "../prontuario/portas";
import type { ItemPlano, PlanoTratamento } from "./tipos";

export type Planos = {
  listarPorPaciente(clinicaId: string, pacienteId: string): Promise<PlanoTratamento[]>;
  buscarPorId(id: string): Promise<PlanoTratamento | null>;
  salvar(plano: PlanoTratamento): Promise<void>;
};

export type ItensPlanoPorta = {
  listarPorPlano(planoId: string): Promise<ItemPlano[]>;
  listarPorAgendamento(clinicaId: string, agendamentoId: string): Promise<ItemPlano[]>;
  buscarPorId(id: string): Promise<ItemPlano | null>;
  salvar(item: ItemPlano, clinicaId: string): Promise<void>;
};

export type Dependencias = {
  planos: Planos;
  itens: ItensPlanoPorta;
  pacientes: Pick<Pacientes, "buscarPorId">;
  procedimentos: Pick<Procedimentos, "buscarPorId">;
  agendamentos: Pick<Agendamentos, "buscarPorId">;
  registros: RegistrosOdontograma;
  auditoria: Auditoria;
  ids: { novo(): string };
};
