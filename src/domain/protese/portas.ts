import type { Agendamentos } from "../agendamento/portas";
import type { Dentistas } from "../dentista/portas";
import type { Pacientes } from "../paciente/portas";
import type { Procedimentos } from "../procedimento/portas";
import type { AvisoProtese, ConfigAtrasoProtese, Protese } from "./tipos";

export type Proteses = {
  listarPorPaciente(clinicaId: string, pacienteId: string): Promise<Protese[]>;
  buscarPorId(id: string): Promise<Protese | null>;
  salvar(protese: Protese): Promise<void>;
};

export type ConfiguracoesProtese = {
  buscar(clinicaId: string): Promise<ConfigAtrasoProtese | null>;
  salvar(config: ConfigAtrasoProtese): Promise<void>;
};

export type AvisosProtese = {
  buscarPorProtese(proteseId: string): Promise<AvisoProtese | null>;
  salvar(aviso: AvisoProtese): Promise<void>;
};

export type Dependencias = {
  proteses: Proteses;
  configuracoes: ConfiguracoesProtese;
  avisos: AvisosProtese;
  pacientes: Pick<Pacientes, "buscarPorId">;
  dentistas: Pick<Dentistas, "buscarPorId" | "listar">;
  procedimentos: Pick<Procedimentos, "buscarPorId">;
  agendamentos: Pick<Agendamentos, "buscarPorId">;
  ids: { novo(): string };
};
