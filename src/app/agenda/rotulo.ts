import type { StatusAgendamento } from "../../domain/agendamento/tipos";

export type VarianteStatus = "secondary" | "warning" | "default" | "success" | "outline";

const VARIANTES: Record<StatusAgendamento, VarianteStatus> = {
  agendado: "secondary",
  em_espera: "warning",
  iniciado: "default",
  concluido: "success",
  cancelado: "outline",
};

export function varianteStatus(status: StatusAgendamento): VarianteStatus {
  return VARIANTES[status];
}

const ROTULOS: Record<StatusAgendamento, string> = {
  agendado: "agendado",
  em_espera: "em espera",
  iniciado: "iniciado",
  concluido: "concluído",
  cancelado: "cancelado",
};

export function rotuloStatus(status: StatusAgendamento): string {
  return ROTULOS[status];
}
