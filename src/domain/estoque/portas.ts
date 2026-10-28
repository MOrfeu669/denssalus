import type { Agendamento } from "../agendamento/tipos";
import type { Clinica } from "../clinica/tipos";
import type { ItemPlano } from "../plano/tipos";
import type { Procedimento } from "../procedimento/tipos";
import type {
  AvisoEstoque,
  Lote,
  Material,
  Movimentacao,
  VinculoMaterial,
} from "./tipos";

export type Dependencias = {
  materiais: {
    listar(clinicaId: string): Promise<Material[]>;
    buscarPorId(id: string): Promise<Material | null>;
    buscarPorNome(clinicaId: string, nome: string): Promise<Material | null>;
    salvar(material: Material): Promise<void>;
  };
  lotes: {
    listarPorMaterial(materialId: string): Promise<Lote[]>;
    salvar(lote: Lote): Promise<void>;
  };
  vinculos: {
    listarPorProcedimento(procedimentoId: string): Promise<VinculoMaterial[]>;
    salvar(vinculo: VinculoMaterial): Promise<void>;
  };
  movimentacoes: {
    listar(materialId: string): Promise<Movimentacao[]>;
    registrar(movimentacao: Movimentacao): Promise<void>;
  };
  avisos: {
    existeMinimo(materialId: string): Promise<boolean>;
    registrar(aviso: AvisoEstoque): Promise<void>;
  };
  agendamentos: { buscarPorId(id: string): Promise<Agendamento | null> };
  itensPlano: {
    listarPorAgendamento(clinicaId: string, agendamentoId: string): Promise<ItemPlano[]>;
  };
  procedimentos: { buscarPorId(id: string): Promise<Procedimento | null> };
  clinicas: { buscarPorId(id: string): Promise<Clinica | null> };
  ids: { novo(): string };
};
