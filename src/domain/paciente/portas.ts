import type { Clinicas } from "../clinica/portas";
import type { Paciente } from "./tipos";

export type Pacientes = {
  listar(clinicaId: string): Promise<Paciente[]>;
  buscarPorId(id: string): Promise<Paciente | null>;
  buscarPorCpf(clinicaId: string, cpf: string): Promise<Paciente | null>;
  salvar(paciente: Paciente): Promise<void>;
};

export type Dependencias = {
  pacientes: Pacientes;
  clinicas: Pick<Clinicas, "buscarPorId">;
  ids: { novo(): string };
};
