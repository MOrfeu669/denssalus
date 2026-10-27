import type { Cadeiras, Clinicas } from "../clinica/portas";
import type { Dentistas } from "../dentista/portas";
import type { Pacientes } from "../paciente/portas";
import type { Procedimentos } from "../procedimento/portas";
import type { Agendamento, BloqueioAgenda, ConflitoAgenda } from "./tipos";

export type Agendamentos = {
  listar(clinicaId: string): Promise<Agendamento[]>;
  listarEntre(clinicaId: string, inicio: string, fim: string): Promise<Agendamento[]>;
  buscarPorId(id: string): Promise<Agendamento | null>;
  // null se gravou. Se a nova linha (emergencia false e status ativo) sobrepõe
  // outra linha ativa não-emergência no intervalo [inicio, fim), devolve o
  // primeiro conflito nesta ordem: cadeira, dentista, paciente. A própria linha
  // (mesmo id) não conflita consigo. Emergência e status cancelado/concluido
  // não ocupam.
  salvar(agendamento: Agendamento): Promise<ConflitoAgenda | null>;
};

export type BloqueiosAgenda = {
  listar(clinicaId: string): Promise<BloqueioAgenda[]>;
  listarEntre(clinicaId: string, inicio: string, fim: string): Promise<BloqueioAgenda[]>;
  salvar(bloqueio: BloqueioAgenda): Promise<void>;
};

export type AvisoRecepcionista = {
  clinicaId: string;
  agendamentoId: string;
  pacienteId: string;
  motivo: string;
};

export type Avisos = {
  avisarRecepcionista(aviso: AvisoRecepcionista): Promise<void>;
};

export type Dependencias = {
  agendamentos: Agendamentos;
  avisos: Avisos;
  bloqueios: BloqueiosAgenda;
  clinicas: Pick<Clinicas, "buscarPorId">;
  cadeiras: Pick<Cadeiras, "listar">;
  dentistas: Pick<Dentistas, "buscarPorId" | "listar">;
  pacientes: Pick<Pacientes, "buscarPorId" | "listar">;
  procedimentos: Pick<Procedimentos, "buscarPorId" | "listar">;
  ids: { novo(): string };
};
