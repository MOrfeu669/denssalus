import type { Agendamento, BloqueioAgenda } from "../agendamento/tipos";
import type { Papel } from "../auth/tipos";
import type { Clinica } from "../clinica/tipos";
import type { Debito, Pagamento } from "../debito/tipos";
import type { Dentista } from "../dentista/tipos";
import type { Lote, Material } from "../estoque/tipos";
import type { ItemPlano } from "../plano/tipos";
import type { Procedimento } from "../procedimento/tipos";
import type { Protese } from "../protese/tipos";
import type { CampoDashboard } from "./tipos";

export type Dependencias = {
  agendamentos: { listar(clinicaId: string): Promise<Agendamento[]> };
  bloqueios: { listar(clinicaId: string): Promise<BloqueioAgenda[]> };
  debitos: { listar(clinicaId: string): Promise<Debito[]> };
  pagamentos: { listarPorDebitos(debitoIds: string[]): Promise<Pagamento[]> };
  itens: { listarPorClinica(clinicaId: string): Promise<ItemPlano[]> };
  procedimentos: { listar(clinicaId: string): Promise<Procedimento[]> };
  proteses: { listarPorClinica(clinicaId: string): Promise<Protese[]> };
  materiais: { listar(clinicaId: string): Promise<Material[]> };
  lotes: { listarPorMaterial(materialId: string): Promise<Lote[]> };
  dentistas: { listar(clinicaId: string): Promise<Dentista[]> };
  clinicas: { buscarPorId(id: string): Promise<Clinica | null> };
  visibilidade: {
    buscar(clinicaId: string, papel: Papel): Promise<CampoDashboard[]>;
    salvar(clinicaId: string, papel: Papel, campos: CampoDashboard[]): Promise<void>;
  };
  preferencias: {
    buscar(usuarioId: string): Promise<{ widgetsOcultos: CampoDashboard[]; periodo: string } | null>;
    salvar(usuarioId: string, widgetsOcultos: CampoDashboard[], periodo: string): Promise<void>;
  };
  ids: { novo(): string };
};
