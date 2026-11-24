import type { Paciente } from "../../domain/paciente/tipos";

export type PacienteLinha = Paciente & { idade: number | null };
