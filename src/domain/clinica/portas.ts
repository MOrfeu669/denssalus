import type { Usuarios } from "../auth/portas";
import type { AgendamentoFuturo, Cadeira, Clinica } from "./tipos";

export type Clinicas = {
  buscarPorAdmin(adminId: string): Promise<Clinica | null>;
  buscarPorId(id: string): Promise<Clinica | null>;
  salvar(clinica: Clinica): Promise<void>;
  remover(id: string): Promise<void>;
};

export type Cadeiras = {
  listar(clinicaId: string): Promise<Cadeira[]>;
  salvar(cadeira: Cadeira): Promise<void>;
  removerDaClinica(clinicaId: string): Promise<void>;
};

export type AgendaAlertas = {
  listarAgendadosFuturos(clinicaId: string, agora: Date): Promise<AgendamentoFuturo[]>;
  salvarAlertas(itens: AgendamentoFuturo[]): Promise<void>;
};

export type Dependencias = {
  clinicas: Clinicas;
  cadeiras: Cadeiras;
  agenda: AgendaAlertas;
  usuarios: Usuarios;
  ids: { novo(): string };
};
