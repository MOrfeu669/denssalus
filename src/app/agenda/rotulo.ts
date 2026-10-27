import type { StatusAgendamento } from "../../domain/agendamento/tipos";

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
