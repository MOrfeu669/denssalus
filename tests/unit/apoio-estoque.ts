import type { Agendamento } from "../../src/domain/agendamento/tipos";
import type { Papel, Sessao } from "../../src/domain/auth/tipos";
import type { Clinica } from "../../src/domain/clinica/tipos";
import type { Dependencias } from "../../src/domain/estoque/portas";
import type {
  AvisoEstoque,
  Lote,
  Material,
  Movimentacao,
  VinculoMaterial,
} from "../../src/domain/estoque/tipos";
import type { ItemPlano } from "../../src/domain/plano/tipos";
import type { Procedimento } from "../../src/domain/procedimento/tipos";

export const CLINICA_ID = "clinica-001";
export const OUTRA_CLINICA = "clinica-002";
export const HOJE = new Date("2026-10-28T12:00:00.000Z");

export class Memoria {
  clinicas = new Map<string, Clinica>();
  materiais = new Map<string, Material>();
  lotes = new Map<string, Lote>();
  vinculos = new Map<string, VinculoMaterial>();
  movimentacoes: Movimentacao[] = [];
  avisos: AvisoEstoque[] = [];
  agendamentos = new Map<string, Agendamento>();
  itensPlano: (ItemPlano & { clinicaId: string })[] = [];
  procedimentos = new Map<string, Procedimento>();
  proximoId = 0;

  constructor() {
    this.clinicas.set(CLINICA_ID, {
      id: CLINICA_ID,
      nome: "Clínica OdontoSmile",
      adminId: "ator-admin",
      diasAtendimento: ["segunda"],
      horarioAbertura: "08:00",
      horarioFechamento: "18:00",
    });
  }

  deps(): Dependencias {
    return {
      materiais: {
        listar: async (clinicaId) =>
          [...this.materiais.values()].filter((item) => item.clinicaId === clinicaId),
        buscarPorId: async (id) => this.materiais.get(id) ?? null,
        buscarPorNome: async (clinicaId, nome) =>
          [...this.materiais.values()].find(
            (item) => item.clinicaId === clinicaId && item.nome === nome,
          ) ?? null,
        salvar: async (material) => {
          this.materiais.set(material.id, material);
        },
      },
      lotes: {
        listarPorMaterial: async (materialId) =>
          [...this.lotes.values()].filter((lote) => lote.materialId === materialId),
        salvar: async (lote) => {
          this.lotes.set(lote.id, lote);
        },
      },
      vinculos: {
        listarPorProcedimento: async (procedimentoId) =>
          [...this.vinculos.values()].filter((item) => item.procedimentoId === procedimentoId),
        salvar: async (vinculo) => {
          this.vinculos.set(`${vinculo.procedimentoId}:${vinculo.materialId}`, vinculo);
        },
      },
      movimentacoes: {
        listar: async (materialId) =>
          this.movimentacoes.filter((item) => item.materialId === materialId),
        registrar: async (movimentacao) => {
          this.movimentacoes.push(movimentacao);
        },
      },
      avisos: {
        existeMinimo: async (materialId) =>
          this.avisos.some((a) => a.materialId === materialId && a.tipo === "estoque_minimo"),
        registrar: async (aviso) => {
          this.avisos.push(aviso);
        },
      },
      agendamentos: { buscarPorId: async (id) => this.agendamentos.get(id) ?? null },
      itensPlano: {
        listarPorAgendamento: async (clinicaId, agendamentoId) =>
          this.itensPlano.filter(
            (item) => item.clinicaId === clinicaId && item.agendamentoId === agendamentoId,
          ),
      },
      procedimentos: { buscarPorId: async (id) => this.procedimentos.get(id) ?? null },
      clinicas: { buscarPorId: async (id) => this.clinicas.get(id) ?? null },
      ids: { novo: () => `id-${++this.proximoId}` },
    };
  }

  material(parcial: Partial<Material> = {}): Material {
    const material: Material = {
      id: "m1",
      clinicaId: CLINICA_ID,
      nome: "Resina Composta",
      quantidadeMinima: 0,
      ...parcial,
    };
    this.materiais.set(material.id, material);
    return material;
  }

  lote(parcial: Partial<Lote> = {}): Lote {
    const lote: Lote = {
      id: "l1",
      materialId: "m1",
      quantidade: 50,
      validade: "2027-01-01",
      criadoEm: "2026-01-01T00:00:00.000Z",
      ...parcial,
    };
    this.lotes.set(lote.id, lote);
    return lote;
  }

  procedimento(id: string, clinicaId = CLINICA_ID): void {
    this.procedimentos.set(id, {
      id,
      clinicaId,
      nome: "Restauração",
      tempoMedioMinutos: 40,
      valorMedio: 150,
    });
  }

  vinculo(procedimentoId: string, quantidade: number, materialId = "m1"): void {
    this.vinculos.set(`${procedimentoId}:${materialId}`, { procedimentoId, materialId, quantidade });
  }

  agendamento(parcial: Partial<Agendamento> = {}): Agendamento {
    const agendamento: Agendamento = {
      id: "a1",
      clinicaId: CLINICA_ID,
      pacienteId: "paciente-joao",
      dentistaId: "dentista-carlos",
      cadeiraId: "cadeira-1",
      procedimentoId: null,
      inicio: "2026-10-28T09:00",
      fim: "2026-10-28T09:40",
      status: "iniciado",
      iniciadoPor: "ator-dentista",
      emergencia: false,
      criadoPor: "ator-admin",
      alertaCadeira: false,
      alertaHorario: false,
      alertaDentista: false,
      motivoCancelamento: null,
      canceladoPor: null,
      canceladoEm: null,
      concluidoEm: null,
      ...parcial,
    };
    this.agendamentos.set(agendamento.id, agendamento);
    return agendamento;
  }

  item(procedimentoId: string, agendamentoId = "a1"): void {
    this.itensPlano.push({
      id: `item-${procedimentoId}`,
      planoId: "plano-1",
      procedimentoId,
      dentes: [11],
      valor: 150,
      agendamentoId,
      status: "pendente",
      executadoPor: null,
      concluidoEm: null,
      clinicaId: CLINICA_ID,
    });
  }

  quantidadeDosLotes(): number {
    return [...this.lotes.values()].reduce((total, lote) => total + lote.quantidade, 0);
  }
}

export function sessao(papel: Papel, ativo = true): Sessao {
  return {
    usuario: {
      id: `ator-${papel}`,
      nome: "Ator",
      email: `${papel}@clinica.com`,
      papel,
      clinicaId: CLINICA_ID,
      ativo,
    },
  };
}
