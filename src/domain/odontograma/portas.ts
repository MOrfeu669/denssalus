import type { Agendamentos } from "../agendamento/portas";
import type { Pacientes } from "../paciente/portas";
import type { Procedimentos } from "../procedimento/portas";
import type { Auditoria } from "../prontuario/portas";
import type { RegistroOdontograma } from "./tipos";

export type RegistrosOdontograma = {
  listarPorPaciente(clinicaId: string, pacienteId: string): Promise<RegistroOdontograma[]>;
  listarPorAgendamento(clinicaId: string, agendamentoId: string): Promise<RegistroOdontograma[]>;
  buscarPorId(id: string): Promise<RegistroOdontograma | null>;
  salvar(registro: RegistroOdontograma): Promise<void>;
};

export type Dependencias = {
  registros: RegistrosOdontograma;
  auditoria: Auditoria;
  pacientes: Pick<Pacientes, "buscarPorId">;
  procedimentos: Pick<Procedimentos, "buscarPorId">;
  agendamentos: Pick<Agendamentos, "buscarPorId">;
  ids: { novo(): string };
};
