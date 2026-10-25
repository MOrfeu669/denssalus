import type { AuthGateway, Usuarios } from "../auth/portas";
import type { Clinicas } from "../clinica/portas";
import type { AgendamentoDoDentista, Dentista } from "./tipos";

export type Dentistas = {
  listar(clinicaId: string): Promise<Dentista[]>;
  buscarPorId(id: string): Promise<Dentista | null>;
  salvar(dentista: Dentista): Promise<void>;
};

export type AgendaDoDentista = {
  listarAgendadosFuturos(clinicaId: string, agora: Date): Promise<AgendamentoDoDentista[]>;
  salvarAlertas(itens: AgendamentoDoDentista[]): Promise<void>;
};

export type Dependencias = {
  dentistas: Dentistas;
  agenda: AgendaDoDentista;
  auth: AuthGateway;
  usuarios: Usuarios;
  clinicas: Pick<Clinicas, "buscarPorAdmin">;
  ids: { novo(): string };
};
