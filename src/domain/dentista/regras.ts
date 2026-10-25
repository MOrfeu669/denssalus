import type { Dentista } from "./tipos";

// Especialidade é informativa: não entra em nenhuma das duas regras.
export function listarDisponiveis<T extends Pick<Dentista, "ativo">>(dentistas: T[]): T[] {
  return dentistas.filter((dentista) => dentista.ativo);
}

// A Feature 006 chama esta função junto de bloqueiaNovoAgendamento (clínica).
export function bloqueiaDentistaInativo(dentista: Pick<Dentista, "ativo">): boolean {
  return !dentista.ativo;
}
