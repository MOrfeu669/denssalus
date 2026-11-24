import type { StatusAgendamento } from "../../domain/agendamento/tipos";
import type { Papel } from "../../domain/auth/tipos";

export function podeIniciarAtendimento(
  status: StatusAgendamento,
  papel: Papel,
  usuarioId: string,
  dentistaDoHorario: string | null,
): boolean {
  if (status !== "agendado" && status !== "em_espera") return false;
  if (papel === "admin") return true;
  if (papel === "recepcionista") return status === "em_espera";
  return papel === "dentista" && dentistaDoHorario === usuarioId;
}

export function exibeChamar(papel: Papel): boolean {
  return papel === "admin" || papel === "dentista" || papel === "recepcionista";
}
